import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Trash2, ExternalLink, FileText, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";

interface HtmlPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  filename: string;
}

export default function AdminHtmlBlog() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: posts = [], isLoading } = useQuery<HtmlPost[]>({
    queryKey: ["html-blog-posts"],
    queryFn: () => api.htmlBlog.list(),
  });

  const safeFetch = async (url: string, options: RequestInit) => {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  };

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      safeFetch("/api/html-blog", { method: "POST", body: formData }),
    onSuccess: () => {
      toast.success("Blog post published successfully");
      queryClient.invalidateQueries({ queryKey: ["html-blog-posts"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) =>
      safeFetch(`/api/html-blog/${slug}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["html-blog-posts"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete post"),
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setCategory("General");
    setSelectedFile(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select an HTML file");
    if (!title || !slug) return toast.error("Title and slug are required");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("category", category);
    uploadMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold font-serif">Blog — HTML Pages</h1>
            <p className="text-muted-foreground mt-1">Upload HTML files to publish blog pages</p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload New Page
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload HTML Blog Page</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>HTML File *</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-muted-foreground text-sm">
                          ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Click to choose an HTML file</p>
                        <p className="text-xs mt-1 opacity-70">Max 10MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,text/html"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Things to Do in Lagos 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/blog/</span>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="pl-14"
                        placeholder="my-blog-post"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Tourism, Books, Film"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description shown on the blog list page"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={uploadMutation.isPending}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadMutation.isPending ? "Publishing..." : "Publish Page"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No HTML blog pages yet. Upload your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.slug}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      {post.category && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
                          {post.category}
                        </span>
                      )}
                    </div>
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{post.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      /blog/{post.slug} · {format(new Date(post.publishedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this post? This cannot be undone.")) {
                          deleteMutation.mutate(post.slug);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
