import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import MediaCarousel from "@/components/MediaCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Book, Film, MapPin, Calendar, Newspaper, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface MediaItem {
  id: number;
  title: string;
  slug: string;
  coverImage: string | null;
  type: "book" | "film" | "tv";
  isFeatured: boolean;
  description?: string | null;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  categoryName?: string;
  authorName?: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  featuredImage: string | null;
  shortDescription: string | null;
  isInStock: boolean;
  category?: {
    name: string;
    slug: string;
  };
}

interface Event {
  id: number;
  title: string;
  slug: string;
  eventDate: string;
  location: string | null;
  isVirtual: boolean;
  featuredImage: string | null;
  status: string;
}

interface PressItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  source: string | null;
  publishedDate: string | null;
  newspaperImage: string | null;
  isFeatured: boolean;
}

const Index = () => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      if (!Layout) {
        throw new Error("Layout component not found");
      }
      if (!MediaCarousel) {
        console.warn("MediaCarousel component not found, will use fallback");
      }
    } catch (error) {
      console.error("Component initialization error:", error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "Component error",
      );
    }
  }, []);

  const {
    data: mediaData,
    isLoading: mediaLoading,
    error: mediaError,
  } = useQuery({
    queryKey: ["featured-media"],
    queryFn: async () => {
      try {
        const data = await api.media.list({ featured: true, limit: 12 });
        return data.items || [];
      } catch (error) {
        console.error("Error fetching media:", error);
        return [];
      }
    },
    retry: 1,
  });

  const {
    data: articlesData,
    isLoading: articlesLoading,
    error: articlesError,
  } = useQuery({
    queryKey: ["featured-articles"],
    queryFn: async () => {
      try {
        const data = await api.articles.list({
          limit: 3,
          status: "published",
        });
        return data.articles || [];
      } catch (error) {
        console.error("Error fetching articles:", error);
        return [];
      }
    },
    retry: 1,
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      try {
        const data = await api.products.list({
          featured: true,
          limit: 3,
        });
        return data.products || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
    retry: 1,
  });

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      try {
        const data = await api.events.list({
          limit: 3,
          status: "upcoming",
        });
        return data.events || [];
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
    },
    retry: 1,
  });

  const {
    data: pressData,
    isLoading: pressLoading,
  } = useQuery({
    queryKey: ["latest-press"],
    queryFn: async () => {
      try {
        const data = await api.press.list({ limit: 3, status: "published" });
        return data.pressItems || [];
      } catch (error) {
        console.error("Error fetching press items:", error);
        return [];
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (mediaError || articlesError || productsError || eventsError) {
      console.error("Query errors detected:", {
        mediaError,
        articlesError,
        productsError,
        eventsError,
      });
      setHasError(true);
      setErrorMessage("Failed to load some data. Please refresh the page.");
    }
  }, [mediaError, articlesError, productsError, eventsError]);

  const featuredItems = mediaData || [];
  const articles = articlesData || [];
  const products = productsData || [];
  const events = eventsData || [];
  const pressItems: PressItem[] = pressData || [];

  // Get default images for each type
  const getDefaultImage = (type: string) => {
    const images = {
      book: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
      film: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
      tv: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=600&fit=crop",
    };
    return images[type as keyof typeof images] || images.book;
  };

  // Create fallback items if no featured items exist
  const getFallbackItems = () => {
    return [
      {
        id: 1,
        title: "Nigerian Heritage",
        image: getDefaultImage("book"),
        type: "book" as const,
      },
      {
        id: 2,
        title: "Lagos Stories",
        image: getDefaultImage("book"),
        type: "book" as const,
      },
      {
        id: 3,
        title: "Discover Nigeria",
        image: getDefaultImage("film"),
        type: "film" as const,
      },
      {
        id: 4,
        title: "Cultural Journeys",
        image: getDefaultImage("book"),
        type: "book" as const,
      },
      {
        id: 5,
        title: "African Voices",
        image: getDefaultImage("film"),
        type: "film" as const,
      },
      {
        id: 6,
        title: "Tourism Guide",
        image: getDefaultImage("book"),
        type: "book" as const,
      },
    ];
  };

  // Create carousel items with proper images
  // The MediaCarousel component now manages its own static items.
  // We will keep the API logic for other sections of the page.
  const carouselItems =
    featuredItems.length > 0
      ? featuredItems.map((item) => ({
          id: item.id,
          title: item.title,
          image: item.coverImage || getDefaultImage(item.type),
          type: item.type,
        }))
      : getFallbackItems();

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(cents / 100);
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const isLoading =
    mediaLoading || articlesLoading || productsLoading || eventsLoading || pressLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BAUHAUS...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <section className="py-16 md:py-24 px-6 text-center">
        <div className="mx-auto max-w-4xl animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif mb-6 leading-tight">
            Books, Films, Publishing & Tourism
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connecting readers, filmmakers, and travelers to the rich stories
            and destinations of Nigerian culture.
          </p>
        </div>
      </section>

      {/* Carousel Section - ALWAYS SHOW with proper items */}
      <section className="py-12 md:py-16">
        <div className="px-6 mb-8">
          <h2 className="text-xl font-serif text-center">Featured Content</h2>
        </div>

        {/* Always render MediaCarousel with items */}
          {MediaCarousel ? (
            <MediaCarousel />
          ) : (
          // Fallback if MediaCarousel component is not available
          <div className="px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {carouselItems.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="bg-muted rounded-lg overflow-hidden aspect-[2/3]"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="p-2 bg-black/70 text-white text-xs truncate">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-serif text-center mb-12">
            Latest Updates
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Book className="h-5 w-5" />
                Recent Articles
              </h3>
              <div className="space-y-4">
                {articles.length > 0 ? (
                  articles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/blog/${article.slug}`}
                      className="block border-b border-border pb-4 last:border-0 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-medium text-sm mb-1">
                        {article.title}
                      </h4>
                      {article.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(article.publishedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No articles yet
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </h3>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.slug}`}
                      className="block border-b border-border pb-4 last:border-0 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-medium text-sm mb-1">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.eventDate), "MMM d, yyyy")}
                        {event.location && (
                          <>
                            <span className="mx-1">•</span>
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No upcoming events
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Film className="h-5 w-5" />
                Featured Products
              </h3>
              <div className="space-y-4">
                {products.length > 0 ? (
                  products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/shop/product/${product.slug}`}
                      className="block border-b border-border pb-4 last:border-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                          {product.featuredImage ? (
                            <img
                              src={product.featuredImage}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">
                            {product.title}
                          </h4>
                          <p className="text-xs font-semibold highlight-yellow">
                            {formatPrice(product.price)}
                          </p>
                          {product.category && (
                            <p className="text-xs text-muted-foreground">
                              {product.category.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No featured products
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {pressItems.length > 0 && (
        <section className="py-16 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-xl font-serif flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                In the Press
              </h2>
              <Link
                to="/press"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pressItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/press/${item.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden card-hover border-border h-full">
                    <div className="aspect-video relative bg-muted">
                      {item.newspaperImage ? (
                        <img
                          src={item.newspaperImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-serif font-medium text-sm group-hover:text-accent transition-colors mb-2">
                        {item.title}
                      </h3>
                      {(item.source || item.publishedDate) && (
                        <p className="text-xs text-muted-foreground">
                          {item.source}
                          {item.source && item.publishedDate && " • "}
                          {item.publishedDate &&
                            format(new Date(item.publishedDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-6 bg-secondary/50">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <blockquote className="quote-text mb-6">
            "BAUHAUS brings together the best of Nigerian storytelling through
            books, films, and unforgettable travel experiences."
          </blockquote>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Link to="/books" className="group">
              <Card className="p-6 card-hover border-border">
                <CardContent className="p-0">
                  <h3 className="text-lg font-serif mb-3 group-hover:opacity-80 transition-colors">
                    Books & Publishing
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Discover our catalog of compelling stories celebrating
                    Nigerian culture and heritage.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/film" className="group">
              <Card className="p-6 card-hover border-border">
                <CardContent className="p-0">
                  <h3 className="text-lg font-serif mb-3 group-hover:opacity-80 transition-colors">
                    Films & Documentaries
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visual storytelling that captures the essence of African
                    narratives.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/events" className="group">
              <Card className="p-6 card-hover border-border">
                <CardContent className="p-0">
                  <h3 className="text-lg font-serif mb-3 group-hover:opacity-80 transition-colors">
                    Events & Tourism
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore Lagos, Abuja, Akwa Ibom, and more with our
                    comprehensive travel guides.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
