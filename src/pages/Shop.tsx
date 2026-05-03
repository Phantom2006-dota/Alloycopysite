import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount?: number;
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

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoriesData } = useQuery<ProductCategory[]>({
    queryKey: ["shopCategories"],
    queryFn: () => api.productCategories.list(),
  });

  const { data: productsData, isLoading } = useQuery<{ products: Product[]; pagination: any }>({
    queryKey: ["shopProducts", searchQuery],
    queryFn: () => api.products.list({ limit: 12, search: searchQuery || undefined }),
  });

  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ["featuredProducts"],
    queryFn: () => api.products.featured(),
  });

  const categories = categoriesData || [];
  const products = productsData?.products || [];
  const featured = featuredProducts || [];

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(cents / 100);
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 via-white to-stone-100 dark:from-amber-950/20 dark:via-background dark:to-stone-950/40 border-b">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700 mb-4">The Lagoon Cabinet</p>
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Curated Heritage Shop</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Authentic, provenance-led objects sourced from Nigerian makers and presented with clear descriptions, dimensions, and edition details.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white dark:bg-background"
              />
            </div>
          </div>
        </section>

        {categories.length > 0 && !searchQuery && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-serif mb-3 text-center">Shop by Category</h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
                Browse textiles, beads, household objects, and collector pieces with consistent provenance and presentation standards.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/shop/${category.slug}`}
                    className="group relative overflow-hidden rounded-lg aspect-square bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30"
                  >
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-amber-600/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-serif text-lg">{category.name}</h3>
                      {category.productCount !== undefined && (
                        <p className="text-sm text-white/70">{category.productCount} products</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {featured.length > 0 && !searchQuery && (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-serif">Featured Products</h2>
                <Link 
                  to="/shop" 
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featured.slice(0, 4).map((product) => (
                  <Link key={product.id} to={`/shop/product/${product.slug}`}>
                    <Card className="overflow-hidden group h-full border-amber-200/50 hover:border-amber-400 transition-colors">
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
                        <p className="text-xs text-amber-600 mb-1">{product.category?.name}</p>
                        <h3 className="font-medium line-clamp-2 mb-2">{product.title}</h3>
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
            </div>
          </section>
        )}

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-serif mb-8 text-center">
              {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No products found matching your search." : "No products available yet."}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
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
                        <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">{product.category?.name}</p>
                        <h3 className="font-medium line-clamp-2 mb-2">{product.title}</h3>
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
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
