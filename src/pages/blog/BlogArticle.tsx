import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Clock, Calendar, Eye, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { format } from "date-fns";

function extractHtmlParts(raw: string): { styles: string; body: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");

  const styleBlocks = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.outerHTML)
    .join("\n");

  // Remove embedded nav/header/footer so the site's own Layout is used instead
  doc.querySelectorAll("nav, header, footer, .site-nav, .site-header, .site-footer, #nav, #header, #footer").forEach((el) => el.remove());

  const body = doc.body?.innerHTML || raw;
  return { styles: styleBlocks, body };
}

export default function BlogArticle() {
  const { slug } = useParams();

  const {
    data: article,
    isLoading: articleLoading,
    error: articleError,
  } = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.articles.getBySlug(slug!),
    enabled: !!slug,
    retry: false,
  });

  const isArticleNotFound = !!articleError;

  const {
    data: htmlPost,
    isLoading: htmlLoading,
    error: htmlError,
  } = useQuery({
    queryKey: ["html-blog-post", slug],
    queryFn: () => api.htmlBlog.getBySlug(slug!),
    enabled: !!slug && isArticleNotFound,
    retry: false,
  });

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = (platform: string) => {
    const title = encodeURIComponent(article?.title || htmlPost?.title || "");
    const url = encodeURIComponent(shareUrl);
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    };
    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const isLoading = articleLoading || (isArticleNotFound && htmlLoading);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (isArticleNotFound && (htmlError || !htmlPost)) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-serif mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (htmlPost) {
    const { styles, body } = extractHtmlParts(htmlPost.htmlContent || "");
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {styles && (
              <div dangerouslySetInnerHTML={{ __html: styles }} />
            )}

            <div dangerouslySetInnerHTML={{ __html: body }} />

            <Separator className="my-12" />

            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm text-muted-foreground">Share this page:</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleShare("twitter")}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleShare("facebook")}>
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleShare("linkedin")}>
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) return null;

  return (
    <Layout>
      <article className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <header className="mb-12">
            {article.categoryName && (
              <Link
                to={`/blog?category=${article.categorySlug}`}
                className="section-title text-accent mb-4 block hover:underline"
              >
                {article.categoryName}
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-tight mb-6">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(article.publishedAt || article.createdAt), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readingTime || 5} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.viewCount || 0} views
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={article.authorImage} alt={article.authorName} />
                <AvatarFallback>{article.authorName?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Link
                  to={`/blog/author/${article.authorId}`}
                  className="font-medium hover:text-accent transition-colors"
                >
                  {article.authorName}
                </Link>
                {article.authorBio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {article.authorBio}
                  </p>
                )}
              </div>
            </div>
          </header>

          {article.featuredImage && (
            <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-12">
              <img
                src={article.featuredImage}
                alt={article.featuredImageAlt || article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {article.tags.map((tag: any) => (
                <Link
                  key={tag.tagId}
                  to={`/blog?tag=${tag.tagSlug}`}
                  className="px-3 py-1 text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                >
                  #{tag.tagName}
                </Link>
              ))}
            </div>
          )}

          <Separator className="my-12" />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="text-sm text-muted-foreground">Share this article:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => handleShare("twitter")}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleShare("facebook")}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleShare("linkedin")}>
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {article.authorBio && (
            <>
              <Separator className="my-12" />
              <div className="bg-muted/50 rounded-lg p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={article.authorImage} alt={article.authorName} />
                    <AvatarFallback className="text-xl">
                      {article.authorName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-serif font-medium text-lg mb-1">
                      About {article.authorName}
                    </h3>
                    <p className="text-muted-foreground mb-4">{article.authorBio}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/blog/author/${article.authorId}`}>View all posts</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <>
              <Separator className="my-12" />
              <section>
                <h2 className="text-2xl font-serif font-medium mb-8">Related Articles</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {article.relatedArticles.map((related: any) => (
                    <Link key={related.id} to={`/blog/${related.slug}`} className="group">
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-3">
                        {related.featuredImage ? (
                          <img
                            src={related.featuredImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium group-hover:text-accent transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(related.publishedAt), "MMM d, yyyy")}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </article>
    </Layout>
  );
}
