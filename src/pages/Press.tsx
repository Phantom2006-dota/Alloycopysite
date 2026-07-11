import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, FileText, ExternalLink, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface PressItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  source: string | null;
  publishedDate: string | null;
  newspaperImage: string | null;
  pdfUrl: string | null;
  externalLink: string | null;
  isFeatured: boolean;
  status: string;
}

const Press = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["press"],
    queryFn: async () => {
      try {
        const res = await api.press.list({ limit: 100 });
        return res.pressItems || [];
      } catch (error) {
        console.error("Error fetching press items:", error);
        return [];
      }
    },
    retry: 1,
  });

  const pressItems: PressItem[] = data || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Press...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12 md:py-20">
        <h1 className="section-title text-center mb-12 animate-fade-in">PRESS</h1>

        <section className="mx-auto max-w-4xl px-6 mb-20 text-center">
          <p className="text-xl md:text-2xl leading-relaxed font-serif text-foreground/90 mb-8">
            See what the press is saying about our work.
          </p>
          <p className="body-text max-w-2xl mx-auto">
            A curated collection of newspaper features, media mentions, and articles
            covering our books, films, and cultural initiatives.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          {pressItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pressItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group card-hover border-border">
                  <div className="aspect-video relative bg-muted">
                    {item.newspaperImage ? (
                      <img
                        src={item.newspaperImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {item.isFeatured && (
                      <span className="absolute top-2 left-2 bg-foreground text-background px-2 py-1 text-xs rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-serif font-medium">{item.title}</h3>

                    <div className="space-y-2 mt-3">
                      {(item.source || item.publishedDate) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {item.source}
                            {item.source && item.publishedDate && " • "}
                            {item.publishedDate &&
                              format(new Date(item.publishedDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex gap-2 mt-4">
                      {item.pdfUrl && (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accent text-xs px-3 py-1 flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          View PDF
                        </a>
                      )}
                      {item.externalLink && (
                        <a
                          href={item.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-accent-blue text-white rounded hover:opacity-90 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Read Online
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No press features yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for media coverage of our work!
              </p>
            </div>
          )}
        </section>

        <div className="divider mt-12" />
      </div>
    </Layout>
  );
};

export default Press;
