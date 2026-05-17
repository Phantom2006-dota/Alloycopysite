import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

declare global {
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => void;
  }
}

interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  redirect_url: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: Record<string, any>;
  callback?: (data: any) => void;
  onclose?: () => void;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number;
    title: string;
    price: number;
  };
}

export default function CheckoutModal({ open, onOpenChange, product }: CheckoutModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (open && !scriptLoaded) {
      const existingScript = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]');
      if (existingScript) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, [open, scriptLoaded]);

  const priceInMajorUnits = product.price / 100;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!scriptLoaded || !window.FlutterwaveCheckout) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.payments.initialize({
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        productId: product.id,
      });

      if (response.status === "success" && response.data) {
        const paymentData = response.data;

        window.FlutterwaveCheckout({
          public_key: paymentData.public_key,
          tx_ref: paymentData.tx_ref,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_options: paymentData.payment_options,
          redirect_url: paymentData.redirect_url,
          customer: paymentData.customer,
          customizations: paymentData.customizations,
          meta: paymentData.meta,
          callback: (data: any) => {
            console.log("Payment callback:", data);
            if (data.status === "successful" || data.status === "completed") {
              toast.success("Payment successful! Thank you for your purchase.");
              setIsLoading(false);
              onOpenChange(false);
              // No redirect - just stay on the page
            } else {
              toast.error("Payment failed. Please try again.");
              setIsLoading(false);
            }
          },
          onclose: () => {
            setIsLoading(false);
          },
        });
      } else {
        throw new Error("Failed to initialize payment");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initialize payment. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] rounded-xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-serif">Checkout</DialogTitle>
          <DialogDescription>
            Complete your purchase for <span className="font-medium">{product.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-amber-600">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={isLoading || !scriptLoaded}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatPrice(product.price)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Flutterwave. Multiple payment methods available.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
