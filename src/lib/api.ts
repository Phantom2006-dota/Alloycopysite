// [file name]: api.ts
// [file content begin]
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

// Regular request function for JSON data
async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = localStorage.getItem("auth_token");

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...headers,
    },
  };

  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  }

  const baseUrl = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
  const fullUrl = `${baseUrl}${endpoint}`;

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text || text.trim() === "") return {} as T;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

// Unified request function that handles both JSON and FormData
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = localStorage.getItem("auth_token");
  const baseUrl = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
  const fullUrl = `${baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    ...headers,
  };

  // Don't set Content-Type for FormData - browser sets it automatically
  if (!(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text || text.trim() === "") return {} as T;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

// Helper to convert object to FormData for file uploads
function createFormData(
  data: any,
  fileFields?: Record<string, File>,
): FormData {
  const formData = new FormData();

  // Append all regular fields
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      // Handle arrays and objects (except Files)
      if (
        typeof data[key] === "object" &&
        !(data[key] instanceof File) &&
        !(data[key] instanceof Blob)
      ) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key].toString());
      }
    }
  });

  // Append file fields
  if (fileFields) {
    Object.keys(fileFields).forEach((fieldName) => {
      if (fileFields[fieldName]) {
        formData.append(fieldName, fileFields[fieldName]);
      }
    });
  }

  return formData;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiRequest<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: { username, password },
      }),
    register: (data: {
      username: string;
      email: string;
      password: string;
      name: string;
    }) =>
      apiRequest<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: data,
      }),
    me: () => apiRequest<any>("/auth/me"),
    logout: () =>
      apiRequest<{ message: string }>("/auth/logout", { method: "POST" }),
  },

  articles: {
    list: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      status?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.category) searchParams.set("category", params.category);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.status) searchParams.set("status", params.status);
      return apiRequest<{ articles: any[]; pagination: any }>(
        `/articles?${searchParams}`,
      );
    },
    featured: () => apiRequest<any[]>("/articles/featured"),
    byCategory: (slug: string, page = 1) =>
      apiRequest<{ category: any; articles: any[] }>(
        `/articles/category/${slug}?page=${page}`,
      ),
    byAuthor: (id: number, page = 1) =>
      apiRequest<{ author: any; articles: any[] }>(
        `/articles/author/${id}?page=${page}`,
      ),
    getBySlug: (slug: string) => apiRequest<any>(`/articles/${slug}`),

    // Article create with optional featured image file
    create: (data: any, files?: { featuredImage?: File }) => {
      let body: any = data;

      if (files?.featuredImage) {
        const formData = createFormData(data, {
          featuredImage: files.featuredImage,
        });
        body = formData;
      }

      return apiRequest<any>("/articles", { method: "POST", body });
    },

    // Article update with optional featured image file
    update: (id: number, data: any, files?: { featuredImage?: File }) => {
      let body: any = data;

      if (files?.featuredImage) {
        const formData = createFormData(data, {
          featuredImage: files.featuredImage,
        });
        body = formData;
      }

      return apiRequest<any>(`/articles/${id}`, { method: "PUT", body });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/articles/${id}`, { method: "DELETE" }),
    adminList: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      return apiRequest<{ articles: any[]; pagination: any }>(
        `/articles/admin/all?${searchParams}`,
      );
    },
  },

  categories: {
    list: () => apiRequest<any[]>("/categories"),
    get: (slug: string) => apiRequest<any>(`/categories/${slug}`),
    create: (data: { name: string; description?: string }) =>
      apiRequest<any>("/categories", { method: "POST", body: data }),
    update: (id: number, data: { name?: string; description?: string }) =>
      apiRequest<any>(`/categories/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      apiRequest<{ message: string }>(`/categories/${id}`, {
        method: "DELETE",
      }),
  },

  tags: {
    list: () => apiRequest<any[]>("/tags"),
    create: (name: string) =>
      apiRequest<any>("/tags", { method: "POST", body: { name } }),
    delete: (id: number) =>
      apiRequest<{ message: string }>(`/tags/${id}`, { method: "DELETE" }),
  },

  media: {
    list: (params?: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
      featured?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.type) searchParams.set("type", params.type);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.featured) searchParams.set("featured", "true");
      return apiRequest<{ items: any[]; pagination: any }>(
        `/media?${searchParams}`,
      );
    },
    featured: () => apiRequest<any[]>("/media/featured"),
    byType: (type: string, page = 1) =>
      apiRequest<any[]>(`/media/type/${type}?page=${page}`),
    get: (id: number) => apiRequest<any>(`/media/${id}`),

    // Media create with cover image file
    create: (data: any, files?: { coverImage?: File }) => {
      let body: any = data;

      if (files?.coverImage) {
        const formData = createFormData(data, { coverImage: files.coverImage });
        body = formData;
      }

      return apiRequest<any>("/media", { method: "POST", body });
    },

    // Media update with optional cover image file
    update: (id: number, data: any, files?: { coverImage?: File }) => {
      let body: any = data;

      if (files?.coverImage) {
        const formData = createFormData(data, { coverImage: files.coverImage });
        body = formData;
      }

      return apiRequest<any>(`/media/${id}`, { method: "PUT", body });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/media/${id}`, { method: "DELETE" }),
    adminList: (params?: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.type) searchParams.set("type", params.type);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      return apiRequest<{ items: any[]; pagination: any }>(
        `/media/admin/all?${searchParams}`,
      );
    },
  },

  team: {
    list: () => apiRequest<any[]>("/team"),
    byDepartment: (department: string) =>
      apiRequest<any[]>(`/team/department/${department}`),
    get: (id: number) => apiRequest<any>(`/team/${id}`),

    // Team member create with optional profile photo
    create: (data: any, files?: { profilePhoto?: File }) => {
      let body: any = data;

      if (files?.profilePhoto) {
        const formData = createFormData(data, {
          profilePhoto: files.profilePhoto,
        });
        body = formData;
      }

      return apiRequest<any>("/team", { method: "POST", body });
    },

    // Team member update with optional profile photo
    update: (id: number, data: any, files?: { profilePhoto?: File }) => {
      let body: any = data;

      if (files?.profilePhoto) {
        const formData = createFormData(data, {
          profilePhoto: files.profilePhoto,
        });
        body = formData;
      }

      return apiRequest<any>(`/team/${id}`, { method: "PUT", body });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/team/${id}`, { method: "DELETE" }),
    adminList: () => apiRequest<any[]>("/team/admin/all"),
  },

  events: {
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.status) searchParams.set("status", params.status);
      return apiRequest<{ events: any[]; pagination: any }>(
        `/events?${searchParams}`,
      );
    },
    upcoming: () => apiRequest<any[]>("/events/upcoming"),
    past: () => apiRequest<any[]>("/events/past"),
    get: (slug: string) => apiRequest<any>(`/events/${slug}`),

    // Event create with featured image file
    create: (data: any, files?: { featuredImage?: File }) => {
      let body: any = data;

      if (files?.featuredImage) {
        const formData = createFormData(data, {
          featuredImage: files.featuredImage,
        });
        body = formData;
      }

      return apiRequest<any>("/events", { method: "POST", body });
    },

    // Event update with optional featured image file
    update: (id: number, data: any, files?: { featuredImage?: File }) => {
      let body: any = data;

      if (files?.featuredImage) {
        const formData = createFormData(data, {
          featuredImage: files.featuredImage,
        });
        body = formData;
      }

      return apiRequest<any>(`/events/${id}`, { method: "PUT", body });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/events/${id}`, { method: "DELETE" }),
    adminList: () => apiRequest<any[]>("/events/admin/all"),
  },

  uploads: {
    list: (params?: {
      page?: number;
      limit?: number;
      folder?: string;
      search?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.folder) searchParams.set("folder", params.folder);
      if (params?.search) searchParams.set("search", params.search);
      return apiRequest<{ uploads: any[]; pagination: any }>(
        `/uploads?${searchParams}`,
      );
    },

    // Upload file - already handles FormData correctly
    upload: async (file: File, alt?: string, folder?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (alt) formData.append("alt", alt);
      if (folder) formData.append("folder", folder);

      return apiRequest<any>("/uploads", { method: "POST", body: formData });
    },

    update: (id: number, data: { alt?: string; folder?: string }) =>
      apiRequest<any>(`/uploads/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      apiRequest<{ message: string }>(`/uploads/${id}`, { method: "DELETE" }),
  },

  products: {
    list: (params?: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      featured?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.category) searchParams.set("category", params.category);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.featured) searchParams.set("featured", "true");
      return apiRequest<{ products: any[]; pagination: any }>(
        `/products?${searchParams}`,
      );
    },
    featured: () => apiRequest<any[]>("/products/featured"),
    byCategory: (slug: string, page = 1) =>
      apiRequest<{ category: any; products: any[]; pagination: any }>(
        `/products/category/${slug}?page=${page}`,
      ),
    get: (idOrSlug: string | number) =>
      apiRequest<any>(`/products/${idOrSlug}`),

    // Product create with optional images
    create: (data: any, files?: { featuredImage?: File; images?: File[] }) => {
      let body: any = data;

      if (files?.featuredImage || files?.images) {
        const formData = createFormData(data);

        if (files.featuredImage) {
          formData.append("featuredImage", files.featuredImage);
        }

        if (files.images) {
          files.images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
          });
        }

        body = formData;
      }

      return apiRequest<any>("/products", { method: "POST", body });
    },

    // Product update with optional images
    update: (
      id: number,
      data: any,
      files?: { featuredImage?: File; images?: File[] },
    ) => {
      let body: any = data;

      if (files?.featuredImage || files?.images) {
        const formData = createFormData(data);

        if (files.featuredImage) {
          formData.append("featuredImage", files.featuredImage);
        }

        if (files.images) {
          files.images.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
          });
        }

        body = formData;
      }

      return apiRequest<any>(`/products/${id}`, { method: "PUT", body });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/products/${id}`, { method: "DELETE" }),
    adminList: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      category?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.category)
        searchParams.set("category", params.category.toString());
      return apiRequest<{ products: any[]; pagination: any }>(
        `/products/admin/all?${searchParams}`,
      );
    },
  },

  productCategories: {
    list: () => apiRequest<any[]>("/product-categories"),
    get: (slug: string) => apiRequest<any>(`/product-categories/${slug}`),
    products: (slug: string, page = 1, limit = 12) =>
      apiRequest<{ category: any; products: any[]; pagination: any }>(
        `/product-categories/${slug}/products?page=${page}&limit=${limit}`,
      ),

    // Product category create with optional image
    create: (data: any, files?: { image?: File }) => {
      let body: any = data;

      if (files?.image) {
        const formData = createFormData(data, { image: files.image });
        body = formData;
      }

      return apiRequest<any>("/product-categories", { method: "POST", body });
    },

    // Product category update with optional image
    update: (id: number, data: any, files?: { image?: File }) => {
      let body: any = data;

      if (files?.image) {
        const formData = createFormData(data, { image: files.image });
        body = formData;
      }

      return apiRequest<any>(`/product-categories/${id}`, {
        method: "PUT",
        body,
      });
    },

    delete: (id: number) =>
      apiRequest<{ message: string }>(`/product-categories/${id}`, {
        method: "DELETE",
      }),
    adminList: () => apiRequest<any[]>("/product-categories/admin/all"),
  },

  health: {
    check: () =>
      apiRequest<{
        status: string;
        timestamp: string;
        version: string;
        mode: string;
      }>("/health"),
  },

  payments: {
    config: () =>
      apiRequest<{ configured: boolean; publicKey: string | null }>(
        "/payments/config",
      ),
    initialize: (data: {
      email: string;
      name: string;
      phone?: string;
      productId: number;
      redirectUrl?: string;
    }) =>
      apiRequest<{
        status: string;
        message: string;
        data: {
          public_key: string;
          tx_ref: string;
          amount: number;
          currency: string;
          payment_options: string;
          redirect_url: string;
          customer: {
            email: string;
            phone_number: string;
            name: string;
          };
          customizations: {
            title: string;
            description: string;
            logo: string;
          };
          meta: {
            product_id: number | null;
            source: string;
          };
        };
      }>("/payments/initialize", { method: "POST", body: data }),
    verify: (transactionId: string) =>
      apiRequest<{
        status: string;
        message: string;
        data: {
          transactionId: number;
          txRef?: string;
          amount?: number;
          currency?: string;
          paymentType?: string;
          customer?: any;
          createdAt?: string;
        };
      }>(`/payments/verify/${transactionId}`),
    initiateBankTransfer: (data: {
      amount: number;
      email: string;
      phone?: string;
      name?: string;
      currency?: string;
    }) =>
      apiRequest<{
        status: string;
        message: string;
        data?: {
          accountNumber: string;
          bankName: string;
          amount: number;
          reference: string;
          expiresAt: string;
        };
      }>("/payments/charge/bank-transfer", { method: "POST", body: data }),
  },

  htmlBlog: {
    list: () => request<any[]>("/html-blog"),
    getBySlug: (slug: string) => request<any>(`/html-blog/${slug}`),
    upload: (formData: FormData) =>
      apiRequest<any>("/html-blog", { method: "POST", body: formData }),
    remove: (slug: string) =>
      apiRequest<any>(`/html-blog/${slug}`, { method: "DELETE" }),
  },
};
// [file content end]
