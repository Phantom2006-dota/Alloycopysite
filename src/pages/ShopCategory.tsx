import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  featuredImage: string | null;
  isInStock: boolean;
  category?: ProductCategory | null;
}

export default function ShopCategory() {
  const { category } = useParams<{ category: string }>();

  const { data, isLoading, error } = useQuery<{
    category: ProductCategory;
    products: Product[];
    pagination: any;
  }>({
    queryKey: ["shopCategory", category],
    queryFn: () => api.products.byCategory(category || ""),
    enabled: !!category,
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(cents / 100);
  };

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-serif mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
            <Link to="/shop">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 via-white to-stone-100 dark:from-amber-950/20 dark:via-background dark:to-stone-950/40 border-b">
          <div className="container mx-auto px-4">
            <Link to="/shop" className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Shop
            </Link>
            {data?.category && (
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-serif mb-4">{data.category.name}</h1>
                {data.category.description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {data.category.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : !data?.products || data.products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No products in this category yet.
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-8 text-center">
                  {data.pagination.total} product{data.pagination.total !== 1 ? 's' : ''} in this category
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {data.products.map((product) => (
                    <Link key={product.id} to={`/shop/product/${product.slug}`}>
                      <Card className="overflow-hidden group h-full border-amber-200/50 hover:border-amber-400 transition-all duration-300 hover:shadow-lg">
                        <div className="aspect-square relative bg-muted overflow-hidden">
                          {product.featuredImage ? (
                            <img
                              src={product.featuredImage}
                              alt={product.title}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                          )}
                          {product.compareAtPrice && (
                            <Badge className="absolute top-2 right-2 bg-red-500">Sale</Badge>
                          )}
                          {!product.isInStock && (
                            <Badge className="absolute top-2 left-2 bg-gray-500">Out of Stock</Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">{data.category?.name}</p>
                          <h3 className="font-medium line-clamp-2 mb-2">{product.title}</h3>
                          {product.shortDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {product.shortDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-600">{formatPrice(product.price)}</span>
                            {product.compareAtPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
