import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ShoppingBag, Check, X, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import CheckoutModal from "@/components/CheckoutModal";

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  featuredImage: string | null;
  images: string | null;
  stock: number;
  isInStock: boolean;
  isFeatured: boolean;
  category?: ProductCategory | null;
}

export default function ShopProduct() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["shopProduct", slug],
    queryFn: () => api.products.get(slug || ""),
    enabled: !!slug,
  });

  const { data: relatedProducts } = useQuery<{ products: Product[] }>({
    queryKey: ["relatedProducts", product?.category?.slug],
    queryFn: () => api.products.byCategory(product?.category?.slug || ""),
    enabled: !!product?.category?.slug,
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(cents / 100);
  };

  const parseImages = (imagesJson: string | null): string[] => {
    if (!imagesJson) return [];
    try {
      return JSON.parse(imagesJson);
    } catch {
      return [];
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-serif mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
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

  if (isLoading || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </Layout>
    );
  }

  const galleryImages = parseImages(product.images);
  const allImages = product.featuredImage 
    ? [product.featuredImage, ...galleryImages]
    : galleryImages;
  const currentImage = selectedImage || allImages[0] || null;

  const related = relatedProducts?.products?.filter(p => p.id !== product.id).slice(0, 4) || [];

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
          <Link to={product.category ? `/shop/${product.category.slug}` : "/shop"} className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6 text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {product.category?.name || "Shop"}
          </Link>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-14">
            {/* Image section */}
            <div className="space-y-3">
              <div className="aspect-square relative bg-muted rounded-xl overflow-hidden border shadow-sm">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                {product.compareAtPrice && (
                  <Badge className="absolute top-3 right-3 bg-red-500">Sale</Badge>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImage === img ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                      }`}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details section */}
            <div className="flex flex-col gap-4">
              {product.category && (
                <Link to={`/shop/${product.category.slug}`} className="text-xs uppercase tracking-widest text-amber-600 hover:text-amber-700 font-medium">
                  {product.category.name}
                </Link>
              )}

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif leading-snug">{product.title}</h1>

              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-amber-600">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                {product.isInStock ? (
                  <>
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-green-600 font-medium">In Stock</span>
                    {product.stock > 0 && product.stock <= 10 && (
                      <span className="text-muted-foreground">(Only {product.stock} left)</span>
                    )}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {product.shortDescription && (
                <p className="text-muted-foreground text-sm leading-relaxed">{product.shortDescription}</p>
              )}

              <Separator />

              {product.description && (
                <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
                  <h3 className="text-base font-medium mb-2">Description</h3>
                  <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}

              {/* Buy button — sticky on mobile */}
              <div className="mt-auto pt-2 space-y-2">
                {product.isInStock ? (
                  <Button
                    onClick={() => setCheckoutOpen(true)}
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-base"
                    size="lg"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Buy Now — {formatPrice(product.price)}
                  </Button>
                ) : (
                  <Button disabled className="w-full h-12 text-base" size="lg">
                    Out of Stock
                  </Button>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  <Link to="/contact" className="text-amber-600 hover:underline">Contact us</Link>{" "}
                  for availability, sizing, or provenance questions.
                </p>
              </div>

              <CheckoutModal
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                product={{ id: product.id, title: product.title, price: product.price }}
              />
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-12 pt-8 border-t">
              <h2 className="text-xl md:text-2xl font-serif mb-6">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {related.map((item) => (
                  <Link key={item.id} to={`/shop/product/${item.slug}`}>
                    <Card className="overflow-hidden group h-full border-amber-200/50 hover:border-amber-400 transition-all duration-300 hover:shadow-lg">
                      <div className="aspect-square relative bg-muted overflow-hidden">
                        {item.featuredImage ? (
                          <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.title}</h3>
                        <span className="font-bold text-sm text-amber-600">{formatPrice(item.price)}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
