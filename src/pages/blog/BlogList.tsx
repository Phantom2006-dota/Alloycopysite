import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Clock, User, ArrowRight, Globe } from "lucide-react";
import { format } from "date-fns";

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.list(),
  });

  const { data: featuredArticles } = useQuery({
    queryKey: ["featured-articles"],
    queryFn: () => api.articles.featured(),
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ["articles", page, category, searchParams.get("search")],
    queryFn: () =>
      api.articles.list({
        page,
        limit: 9,
        category: category || undefined,
        search: searchParams.get("search") || undefined,
      }),
  });

  const { data: htmlPosts = [] } = useQuery<any[]>({
    queryKey: ["html-blog-posts"],
    queryFn: () => api.htmlBlog.list(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: searchInput, page: "1" });
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === category) {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    searchParams.set("page", "1");
    setSearchParams(searchParams);
  };

  const filteredHtmlPosts = htmlPosts.filter((p) => {
    if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false;
    if (searchParams.get("search")) {
      const q = searchParams.get("search")!.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const showHtmlPosts = !category && !searchParams.get("search") && page === 1;

  return (
    <Layout>
      <div className="min-h-screen">
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="page-heading mb-4">Blog & News</h1>
              <p className="body-text max-w-2xl mx-auto">
                Stories, updates, and insights from the world of Nigerian books, films, and culture.
              </p>
            </div>

            {featuredArticles && featuredArticles.length > 0 && !category && !searchParams.get("search") && page === 1 && (
              <div className="mb-16">
                <Link to={`/blog/${featuredArticles[0].slug}`} className="block group">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                      {featuredArticles[0].featuredImage ? (
                        <img
                          src={featuredArticles[0].featuredImage}
                          alt={featuredArticles[0].featuredImageAlt || featuredArticles[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Featured Article
                        </div>
                      )}
                    </div>
                    <div>
                      {featuredArticles[0].categoryName && (
                        <span className="section-title text-accent mb-4 block">
                          {featuredArticles[0].categoryName}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-4 group-hover:text-accent transition-colors">
                        {featuredArticles[0].title}
                      </h2>
                      <p className="body-text mb-6">{featuredArticles[0].excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {featuredArticles[0].authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredArticles[0].readingTime || 5} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </form>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={!category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange("")}
                >
                  All
                </Button>
                {categoriesData?.map((cat: any) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryChange(cat.slug)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* HTML Blog Pages Section */}
            {(showHtmlPosts || filteredHtmlPosts.length > 0) && htmlPosts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Guides & Features
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {(showHtmlPosts ? htmlPosts : filteredHtmlPosts).map((post: any) => (
                    <a
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block"
                    >
                      <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-[4/3] rounded-t-lg overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 flex items-center justify-center">
                          <Globe className="h-16 w-16 text-amber-300 dark:text-amber-700 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <CardContent className="p-4">
                          {post.category && (
                            <span className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 block">
                              {post.category}
                            </span>
                          )}
                          <h3 className="font-serif font-medium text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h3>
                          {post.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>
                            <span className="flex items-center gap-1 ml-auto text-accent font-medium">
                              Read <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
                <div className="h-px bg-border mb-8" />
              </div>
            )}

            {/* Regular Articles */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : articlesData?.articles && articlesData.articles.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articlesData.articles.map((article: any) => (
                    <Link key={article.id} to={`/blog/${article.slug}`} className="group">
                      <Card className="h-full border-0 shadow-none bg-transparent">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-4">
                          {article.featuredImage ? (
                            <img
                              src={article.featuredImage}
                              alt={article.featuredImageAlt || article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              No image
                            </div>
                          )}
                        </div>
                        <CardContent className="p-0">
                          {article.categoryName && (
                            <span className="section-title text-accent mb-2 block text-xs">
                              {article.categoryName}
                            </span>
                          )}
                          <h3 className="font-serif font-medium text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{article.authorName}</span>
                            <span>•</span>
                            <span>{format(new Date(article.publishedAt || article.createdAt), "MMM d, yyyy")}</span>
                            <span>•</span>
                            <span>{article.readingTime || 5} min</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {articlesData.pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => {
                        searchParams.set("page", (page - 1).toString());
                        setSearchParams(searchParams);
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {articlesData.pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === articlesData.pagination.pages}
                      onClick={() => {
                        searchParams.set("page", (page + 1).toString());
                        setSearchParams(searchParams);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No articles found</p>
                {(category || searchParams.get("search")) && (
                  <Button variant="outline" onClick={() => setSearchParams({})}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
