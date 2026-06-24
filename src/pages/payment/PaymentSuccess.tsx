import { useSearchParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, Home, Package } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const productTitle = searchParams.get("product_title") || "Your Purchase";

  useEffect(() => {
    toast.success("Payment Successful!", {
      description: `Thank you for purchasing ${productTitle}.`,
      duration: 5000,
    });
  }, [productTitle]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Card className="max-w-md w-full shadow-lg border-green-200 dark:border-green-800">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl font-serif font-bold mb-2 text-green-700 dark:text-green-300">
              Payment Successful!
            </h1>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 font-medium">
              You have purchased:
            </p>

            <div className="flex items-center justify-center gap-2 mb-6 bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-base font-semibold text-green-700 dark:text-green-300">
                {productTitle}
              </p>
            </div>

            <p className="text-muted-foreground mb-6">
              Your order has been confirmed and is being processed. A confirmation email will be sent to you shortly.
            </p>

            {sessionId && (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Order Reference</p>
                <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 break-all">
                  {sessionId.slice(0, 24)}...
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/shop" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-green-200 hover:bg-green-50 dark:hover:bg-green-950/30">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
