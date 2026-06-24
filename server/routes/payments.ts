import { Router, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const { email, name, phone, productId } = req.body;

    if (!productId || !email || !name) {
      return res.status(400).json({ message: "Product ID, email, and name are required" });
    }

    const productResult = await db.execute(
      sql`SELECT id, title, price, is_in_stock FROM products WHERE id = ${productId} AND status = 'published'`
    );

    if (!productResult.rows || productResult.rows.length === 0) {
      return res.status(404).json({ message: "Product not found or unavailable" });
    }

    const product = productResult.rows[0] as {
      id: number; title: string; price: number; is_in_stock: boolean;
    };

    if (!product.is_in_stock) {
      return res.status(400).json({ message: "This product is currently out of stock" });
    }

    const stripe = await getUncachableStripeClient();

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: product.price,
            product_data: {
              name: product.title,
              metadata: { product_id: String(product.id) },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&product_title=${encodeURIComponent(product.title)}`,
      cancel_url: `${baseUrl}/payment/cancelled`,
      metadata: {
        product_id: String(product.id),
        product_title: product.title,
        customer_name: name,
        customer_phone: phone || '',
      },
    });

    res.json({ status: "success", url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    res.status(500).json({ message: "Failed to create checkout session", error: error.message });
  }
});

router.get("/session/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata,
    });
  } catch (error: any) {
    console.error("Session retrieval error:", error);
    res.status(500).json({ message: "Failed to retrieve session", error: error.message });
  }
});

router.get("/config", async (_req: Request, res: Response) => {
  try {
    await getUncachableStripeClient();
    res.json({ configured: true, provider: "stripe" });
  } catch {
    res.json({ configured: false, provider: "stripe" });
  }
});

export default router;
