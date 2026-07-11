import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Newspaper, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "@/lib/api";

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
  status: "draft" | "published" | "scheduled" | "archived";
  createdAt: string;
}

export default function Press() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PressItem | null>(null);
  const [newspaperImageFile, setNewspaperImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const initialFormData = {
    title: "",
    description: "",
    source: "",
    publishedDate: "",
    newspaperImage: "",
    pdfUrl: "",
    externalLink: "",
    isFeatured: false,
    status: "published" as PressItem["status"],
  };

  const [formData, setFormData] = useState(initialFormData);

  const { data, isLoading } = useQuery<PressItem[]>({
    queryKey: ["press-admin"],
    queryFn: async () => api.press.adminList(),
  });

  const pressItems = data || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const files: { newspaperImage?: File; pdf?: File } = {};
      if (newspaperImageFile) files.newspaperImage = newspaperImageFile;
      if (pdfFile) files.pdf = pdfFile;
      return api.press.create(data, Object.keys(files).length ? files : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["press-admin"] });
      toast.success("Press item created successfully");
      setIsOpen(false);
      setFormData(initialFormData);
      setNewspaperImageFile(null);
      setPdfFile(null);
    },
    onError: (error: any) => {
      console.error("Create error:", error);
      toast.error(error.message || "Failed to create press item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const files: { newspaperImage?: File; pdf?: File } = {};
      if (newspaperImageFile) files.newspaperImage = newspaperImageFile;
      if (pdfFile) files.pdf = pdfFile;
      return api.press.update(id, data, Object.keys(files).length ? files : undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["press-admin"] });
      toast.success("Press item updated successfully");
      setIsOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
      setNewspaperImageFile(null);
      setPdfFile(null);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update press item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.press.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["press-admin"] });
      toast.success("Press item deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete press item");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (item: PressItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      source: item.source || "",
      publishedDate: item.publishedDate
        ? new Date(item.publishedDate).toISOString().slice(0, 10)
        : "",
      newspaperImage: item.newspaperImage || "",
      pdfUrl: item.pdfUrl || "",
      externalLink: item.externalLink || "",
      isFeatured: item.isFeatured,
      status: item.status,
    });
    setNewspaperImageFile(null);
    setPdfFile(null);
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setNewspaperImageFile(null);
    setPdfFile(null);
    setIsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif">Press</h1>
            <p className="text-muted-foreground">Manage newspaper features and media mentions</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Press Item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pressItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No press items yet. Add your first one to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pressItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {item.newspaperImage ? (
                    <img
                      src={item.newspaperImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  {item.source && (
                    <div className="text-sm text-muted-foreground mt-1">{item.source}</div>
                  )}
                  {item.publishedDate && (
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(item.publishedDate), "MMM d, yyyy")}
                    </div>
                  )}
                  {item.pdfUrl && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      PDF attached
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Press Item" : "Add Press Item"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., The Guardian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedDate">Published Date</Label>
                <Input
                  id="publishedDate"
                  type="date"
                  value={formData.publishedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newspaperImageFile">Newspaper Image</Label>
              <Input
                id="newspaperImageFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setNewspaperImageFile(e.target.files[0]);
                    setFormData((prev) => ({ ...prev, newspaperImage: "" }));
                  }
                }}
              />
              {newspaperImageFile ? (
                <p className="text-sm text-green-600 mt-1">
                  File selected: {newspaperImageFile.name} (
                  {(newspaperImageFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : formData.newspaperImage ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Current image on file
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">Press Document (PDF)</Label>
              <Input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPdfFile(e.target.files[0]);
                    setFormData((prev) => ({ ...prev, pdfUrl: "" }));
                  }
                }}
              />
              {pdfFile ? (
                <p className="text-sm text-green-600 mt-1">
                  File selected: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                </p>
              ) : formData.pdfUrl ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Current PDF on file
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalLink">External Link</Label>
              <Input
                id="externalLink"
                value={formData.externalLink}
                onChange={(e) =>
                  setFormData({ ...formData, externalLink: e.target.value })
                }
                placeholder="Link to the original article online"
              />
            </div>

            <div className="flex items-center gap-4">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isFeatured: checked })
                }
              />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Processing..."
                : editingItem
                  ? "Update"
                  : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
