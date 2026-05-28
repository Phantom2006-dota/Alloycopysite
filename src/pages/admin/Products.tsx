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
import { Plus, Pencil, Trash2, ShoppingBag, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { api } from "@/lib/api";

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
  categoryId: number | null;
  images: string | null;
  featuredImage: string | null;
  stock: number;
  isInStock: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: string;
  category?: ProductCategory | null;
  provenance: string | null;
  technique: string | null;
  historicalContext: string | null;
  novelExcerpt: string | null;
  makerStory: string | null;
}

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const initialFormData = {
    title: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    categoryId: "",
    featuredImage: "",
    images: [] as string[],
    stock: "0",
    isInStock: true,
    isFeatured: false,
    status: "published" as const,
    provenance: "",
    technique: "",
    historicalContext: "",
    novelExcerpt: "",
    makerStory: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const { data: categoriesData } = useQuery<ProductCategory[]>({
    queryKey: ["productCategories"],
    queryFn: () => api.productCategories.adminList(),
  });

  const categories = categoriesData || [];

  const { data, isLoading } = useQuery<{ products: Product[]; pagination: any }>({
    queryKey: ["products", statusFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = parseInt(categoryFilter);
      if (searchQuery) params.search = searchQuery;
      return api.products.adminList(params);
    },
  });

  const products = data?.products || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
      setIsOpen(false);
      setFormData(initialFormData);
    },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
      setIsOpen(false);
      setEditingItem(null);
      setFormData(initialFormData);
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      title: formData.title,
      description: formData.description || null,
      shortDescription: formData.shortDescription || null,
      price: parseFloat(formData.price) || 0,
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
      sku: formData.sku || null,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      featuredImage: formData.featuredImage || null,
      images: formData.images.length > 0 ? formData.images : null,
      stock: parseInt(formData.stock) || 0,
      isInStock: formData.isInStock,
      isFeatured: formData.isFeatured,
      status: formData.status,
      provenance: formData.provenance || null,
      technique: formData.technique || null,
      historicalContext: formData.historicalContext || null,
      novelExcerpt: formData.novelExcerpt || null,
      makerStory: formData.makerStory || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const openEdit = (item: Product) => {
    setEditingItem(item);
    let parsedImages: string[] = [];
    try {
      if (item.images) {
        parsedImages = JSON.parse(item.images);
      }
    } catch (e) {
      parsedImages = [];
    }
    
    setFormData({
      title: item.title,
      description: item.description || "",
      shortDescription: item.shortDescription || "",
      price: (item.price / 100).toFixed(2),
      compareAtPrice: item.compareAtPrice ? (item.compareAtPrice / 100).toFixed(2) : "",
      sku: item.sku || "",
      categoryId: item.categoryId?.toString() || "",
      featuredImage: item.featuredImage || "",
      images: parsedImages,
      stock: item.stock.toString(),
      isInStock: item.isInStock,
      isFeatured: item.isFeatured,
      status: item.status as any,
      provenance: item.provenance || "",
      technique: item.technique || "",
      historicalContext: item.historicalContext || "",
      novelExcerpt: item.novelExcerpt || "",
      makerStory: item.makerStory || "",
    });
    setIsOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setIsOpen(true);
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(cents / 100);
  };

  const addImageToGallery = (url: string) => {
    setFormData({ ...formData, images: [...formData.images, url] });
  };

  const removeImageFromGallery = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6" />
            <div>
              <h1 className="text-2xl font-serif">Products</h1>
              <p className="text-muted-foreground">Manage your store products</p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products yet. Add your first product to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square relative bg-muted">
                  {item.featuredImage ? (
                    <img
                      src={item.featuredImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {item.isFeatured && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 text-xs rounded">
                      Featured
                    </span>
                  )}
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs rounded ${
                    item.status === "published" ? "bg-green-500 text-white" : 
                    item.status === "archived" ? "bg-gray-500 text-white" : "bg-yellow-500 text-black"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.category?.name || "No category"}</p>
                  <p className="font-bold mt-1 text-amber-600">{formatPrice(item.price)}</p>
                  {item.compareAtPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.compareAtPrice)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock: {item.stock} {item.isInStock ? "(In Stock)" : "(Out of Stock)"}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
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
              {editingItem ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief product summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (NGN) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At Price (NGN)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  placeholder="Original price for sale display"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Product SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Featured Image (Cloudinary)</Label>
              <ImageUpload
                value={formData.featuredImage}
                onChange={(url) => setFormData({ ...formData, featuredImage: url })}
              />
            </div>

            <div className="space-y-2">
              <Label>Gallery Images (Cloudinary)</Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-square bg-muted rounded overflow-hidden">
                    <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImageFromGallery(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <ImageUpload
                value=""
                onChange={addImageToGallery}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  id="isInStock"
                  checked={formData.isInStock}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInStock: checked })}
                />
                <Label htmlFor="isInStock">In Stock</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Catalogue Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provenance">Provenance</Label>
                  <Textarea
                    id="provenance"
                    value={formData.provenance}
                    onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                    placeholder="Where this object comes from, its origin and journey..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technique">Technique</Label>
                  <Textarea
                    id="technique"
                    value={formData.technique}
                    onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                    placeholder="Craftsmanship methods and materials used..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="historicalContext">Historical Context</Label>
                  <Textarea
                    id="historicalContext"
                    value={formData.historicalContext}
                    onChange={(e) => setFormData({ ...formData, historicalContext: e.target.value })}
                    placeholder="The historical background and cultural significance..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novelExcerpt">Novel Excerpt</Label>
                  <Textarea
                    id="novelExcerpt"
                    value={formData.novelExcerpt}
                    onChange={(e) => setFormData({ ...formData, novelExcerpt: e.target.value })}
                    placeholder="An excerpt from a related novel or literary work..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="makerStory">Maker Story / Video URL</Label>
                  <Textarea
                    id="makerStory"
                    value={formData.makerStory}
                    onChange={(e) => setFormData({ ...formData, makerStory: e.target.value })}
                    placeholder="The artisan's story, or paste a video URL (YouTube, Vimeo)..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {editingItem ? "Update Product" : "Create Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
