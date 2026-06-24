import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ShoppingBag, Home } from "lucide-react";

export default function PaymentCancelled() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            </div>

            <h1 className="text-3xl font-serif font-bold mb-2 text-gray-700 dark:text-gray-300">
              Payment Cancelled
            </h1>

            <p className="text-muted-foreground mb-8">
              Your payment was cancelled. No charge was made. You can go back to the shop and try again whenever you're ready.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/shop" className="w-full sm:w-auto">
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Back to Shop
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
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
