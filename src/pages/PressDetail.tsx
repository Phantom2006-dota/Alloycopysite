import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, FileText, ExternalLink, Newspaper } from "lucide-react";
import { format } from "date-fns";

export default function PressDetail() {
  const { slug } = useParams();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["press-item", slug],
    queryFn: () => api.press.get(slug!),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-serif mb-4">Press feature not found</h1>
          <p className="text-muted-foreground mb-6">
            This press feature doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/press">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Press
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <Link
            to="/press"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Press
          </Link>

          <header className="mb-10">
            {item.isFeatured && (
              <span className="section-title text-accent mb-4 block">Featured</span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-tight mb-6">
              {item.title}
            </h1>

            {(item.source || item.publishedDate) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {item.source}
                  {item.source && item.publishedDate && " • "}
                  {item.publishedDate && format(new Date(item.publishedDate), "MMMM d, yyyy")}
                </span>
              </div>
            )}
          </header>

          <div className="rounded-lg bg-muted mb-2 border border-border">
            {item.newspaperImage ? (
              <div className="max-h-[80vh] overflow-auto">
                <img
                  src={item.newspaperImage}
                  alt={item.title}
                  className="w-full h-auto block"
                />
              </div>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center">
                <Newspaper className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
          </div>
          {item.newspaperImage && (
            <p className="text-xs text-muted-foreground mb-10">
              Scroll within the image to see it at full size.
            </p>
          )}

          {item.description && (
            <p className="text-xl leading-relaxed font-serif text-foreground/90 mb-8">
              {item.description}
            </p>
          )}

          {item.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12 whitespace-pre-wrap">
              {item.content}
            </div>
          )}

          {(item.pdfUrl || item.externalLink) && (
            <>
              <Separator className="my-10" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Original source:</span>
                {item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-accent text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View PDF
                  </a>
                )}
                {item.externalLink && (
                  <a
                    href={item.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-4 py-2 bg-accent-blue text-white rounded hover:opacity-90 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Read Online
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </article>
    </Layout>
  );
}
