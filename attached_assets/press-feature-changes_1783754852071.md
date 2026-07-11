# Press Feature — Full Change Log

This document captures every code and SQL change made to add the "Press" feature
(public press page + admin CRUD for newspaper features with image/PDF uploads).

---

## 1. Database schema change (`shared/schema.ts`)

### Drizzle table definition added

```ts
export const pressItems = pgTable("press_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  source: varchar("source", { length: 255 }),
  publishedDate: timestamp("published_date"),
  newspaperImage: text("newspaper_image"),
  pdfUrl: text("pdf_url"),
  externalLink: text("external_link"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  status: contentStatusEnum("status").default('published').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PressItem = typeof pressItems.$inferSelect;
export type InsertPressItem = typeof pressItems.$inferInsert;
```

`contentStatusEnum` already existed in the schema (reused from other content
tables); no new enum was created.

### Equivalent raw SQL applied to the database

This was applied via `npm run db:push` (Drizzle Kit), not a hand-written
migration file. The generated SQL was equivalent to:

```sql
CREATE TABLE "press_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(500) NOT NULL,
  "slug" varchar(500) NOT NULL UNIQUE,
  "description" text,
  "source" varchar(255),
  "published_date" timestamp,
  "newspaper_image" text,
  "pdf_url" text,
  "external_link" text,
  "is_featured" boolean DEFAULT false NOT NULL,
  "status" content_status DEFAULT 'published' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```

No other tables were altered.

---

## 2. Backend API routes (`server/routes/press.ts` — new file)

Full CRUD router: public list/detail (published-only), admin list, create,
update, delete. Handles two file uploads per item (newspaper image + PDF) via
`multer` memory storage and uploads each to Cloudinary with the correct
`resource_type` (`image` for the photo, `raw` for the PDF).

```ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { pressItems } from "../../shared/schema";
import { eq, desc, and, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../lib/cloudinary";

const router = Router();

const storage = multer.memoryStorage();

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PDF_TYPE = "application/pdf";

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === "newspaperImage") {
    if (IMAGE_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Newspaper image must be an image file (jpeg, png, gif, or webp)."));
  }
  if (file.fieldname === "pdf") {
    if (file.mimetype === PDF_TYPE) {
      return cb(null, true);
    }
    return cb(new Error("Press document must be a PDF file."));
  }
  return cb(new Error("Unexpected file field."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GET /api/press — public, published items only
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", featured } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [eq(pressItems.status, "published")];

    if (featured === "true") {
      conditions.push(eq(pressItems.isFeatured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(pressItems)
      .where(whereClause)
      .orderBy(desc(pressItems.publishedDate), desc(pressItems.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pressItems)
      .where(whereClause);

    res.json({
      pressItems: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get press items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/press/admin/all — admin only, all statuses
router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await db.select().from(pressItems).orderBy(desc(pressItems.createdAt));
    res.json(items);
  } catch (error) {
    console.error("Get admin press items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/press/:slug — public, published only
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [item] = await db
      .select()
      .from(pressItems)
      .where(and(eq(pressItems.slug, slug), eq(pressItems.status, "published")));
    if (!item) {
      return res.status(404).json({ message: "Press item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get press item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/press — admin only, create with optional image + pdf upload
router.post(
  "/",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.fields([
    { name: "newspaperImage", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, source, publishedDate, externalLink, isFeatured, status } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

      let newspaperImageUrl = req.body.newspaperImage || null;
      if (files?.newspaperImage?.[0]) {
        const uploadResult = await uploadToCloudinary(files.newspaperImage[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "image",
        });
        newspaperImageUrl = uploadResult.secure_url;
      }

      let pdfUrl = req.body.pdfUrl || null;
      if (files?.pdf?.[0]) {
        const uploadResult = await uploadToCloudinary(files.pdf[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "raw",
        });
        pdfUrl = uploadResult.secure_url;
      }

      const slug = generateSlug(title);

      const [newItem] = await db
        .insert(pressItems)
        .values({
          title,
          slug,
          description: description || null,
          source: source || null,
          publishedDate: publishedDate ? new Date(publishedDate) : null,
          newspaperImage: newspaperImageUrl,
          pdfUrl,
          externalLink: externalLink || null,
          isFeatured: isFeatured === "true" || isFeatured === true,
          status: status || "published",
        })
        .returning();

      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Create press item error:", error);
      if (error.message?.includes("unique constraint")) {
        return res.status(400).json({ message: "Slug already exists. Please use a different title." });
      }
      res.status(500).json({ message: "Failed to create press item", error: error.message });
    }
  }
);

// PUT /api/press/:id — admin only, update with optional file replacement
router.put(
  "/:id",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.fields([
    { name: "newspaperImage", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      const { title, description, source, publishedDate, externalLink, isFeatured, status } = req.body;

      const [existingItem] = await db.select().from(pressItems).where(eq(pressItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Press item not found" });
      }

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

      let newspaperImageUrl = req.body.newspaperImage !== undefined ? req.body.newspaperImage : existingItem.newspaperImage;
      if (files?.newspaperImage?.[0]) {
        const uploadResult = await uploadToCloudinary(files.newspaperImage[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "image",
        });
        newspaperImageUrl = uploadResult.secure_url;
      }

      let pdfUrl = req.body.pdfUrl !== undefined ? req.body.pdfUrl : existingItem.pdfUrl;
      if (files?.pdf?.[0]) {
        const uploadResult = await uploadToCloudinary(files.pdf[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "raw",
        });
        pdfUrl = uploadResult.secure_url;
      }

      const updates: any = { updatedAt: new Date() };
      if (title) {
        updates.title = title;
        updates.slug = generateSlug(title);
      }
      if (description !== undefined) updates.description = description;
      if (source !== undefined) updates.source = source;
      if (publishedDate !== undefined) updates.publishedDate = publishedDate ? new Date(publishedDate) : null;
      if (newspaperImageUrl !== undefined) updates.newspaperImage = newspaperImageUrl;
      if (pdfUrl !== undefined) updates.pdfUrl = pdfUrl;
      if (externalLink !== undefined) updates.externalLink = externalLink;
      if (isFeatured !== undefined) updates.isFeatured = isFeatured === "true" || isFeatured === true;
      if (status) updates.status = status;

      const [updatedItem] = await db.update(pressItems).set(updates).where(eq(pressItems.id, itemId)).returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Update press item error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// DELETE /api/press/:id — super_admin only
router.delete("/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    const [existingItem] = await db.select().from(pressItems).where(eq(pressItems.id, itemId));
    if (!existingItem) {
      return res.status(404).json({ message: "Press item not found" });
    }

    await db.delete(pressItems).where(eq(pressItems.id, itemId));

    res.json({ message: "Press item deleted successfully" });
  } catch (error) {
    console.error("Delete press item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
```

### Route registration (`server/index.ts`)

```ts
import pressRoutes from "./routes/press";
// ...
app.use("/api/press", pressRoutes);
```

Added alongside the existing route registrations (next to `paymentsRoutes`).

---

## 3. Frontend API client (`src/lib/api.ts`)

Added a `press` namespace, following the same shape as other entities
(`list`, `get`, `create`, `update`, `delete`, `adminList`), supporting the
two file fields via `FormData` when files are attached:

```ts
press: {
  list: (params?: { page?: number; limit?: number; status?: string; featured?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.featured) searchParams.set("featured", "true");
    return apiRequest<{ pressItems: any[]; pagination: any }>(
      `/press?${searchParams}`,
    );
  },
  get: (slug: string) => apiRequest<any>(`/press/${slug}`),

  create: (data: any, files?: { newspaperImage?: File; pdf?: File }) => {
    let body: any = data;

    if (files?.newspaperImage || files?.pdf) {
      const formData = createFormData(data);
      if (files.newspaperImage) formData.append("newspaperImage", files.newspaperImage);
      if (files.pdf) formData.append("pdf", files.pdf);
      body = formData;
    }

    return apiRequest<any>("/press", { method: "POST", body });
  },

  update: (id: number, data: any, files?: { newspaperImage?: File; pdf?: File }) => {
    let body: any = data;

    if (files?.newspaperImage || files?.pdf) {
      const formData = createFormData(data);
      if (files.newspaperImage) formData.append("newspaperImage", files.newspaperImage);
      if (files.pdf) formData.append("pdf", files.pdf);
      body = formData;
    }

    return apiRequest<any>(`/press/${id}`, { method: "PUT", body });
  },

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/press/${id}`, { method: "DELETE" }),
  adminList: () => apiRequest<any[]>("/press/admin/all"),
},
```

---

## 4. Public Press page (`src/pages/Press.tsx` — new file)

React Query fetch of published press items, rendered as a responsive card
grid (newspaper image, title, source/date, description, "View PDF" and
"Read Online" links), with loading/empty states, matching the site's
existing Tailwind styling conventions (`section-title`, `card-hover`, etc.).

Key logic:

```tsx
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
```

Each card conditionally renders a "View PDF" button (`item.pdfUrl`) and a
"Read Online" button (`item.externalLink`), plus a "Featured" badge when
`item.isFeatured` is true.

---

## 5. Admin Press CRUD page (`src/pages/admin/Press.tsx` — new file)

Follows the same pattern as the existing `src/pages/admin/Events.tsx`:

- React Query (`useQuery` for `adminList`, `useMutation` for create/update/delete)
- A `Dialog`-based form with:
  - Title, description, source, published date fields
  - Direct `<Input type="file">` for the newspaper image (`accept="image/*"`)
  - Direct `<Input type="file">` for the PDF (`accept="application/pdf"`)
  - External link field
  - Featured toggle (`Switch`)
  - Status select (draft / published / archived)
- Card grid listing existing press items with Edit/Delete actions
- Toast notifications (`sonner`) on success/failure of each mutation

---

## 6. Navigation wiring

### `src/components/Header.tsx` — About dropdown

```diff
   { name: "Events", path: "/events" },
+  { name: "Press", path: "/press" },
   { name: "Team", path: "/team" },
```

(Both desktop and mobile menus read from this same `navItems` array, so one
edit covers both.)

### `src/components/admin/AdminLayout.tsx` — admin sidebar

```diff
+import { Newspaper } from "lucide-react";
...
   { icon: Calendar, label: "Events", path: "/admin/events" },
+  { icon: Newspaper, label: "Press", path: "/admin/press" },
```

### `src/App.tsx` — route registration

```diff
+import Press from "./pages/Press";
+import AdminPress from "./pages/admin/Press";
...
   <Route path="/events" element={<Events />} />
+  <Route path="/press" element={<Press />} />
...
+  <Route
+    path="/admin/press"
+    element={
+      <ProtectedRoute>
+        <AdminPress />
+      </ProtectedRoute>
+    }
+  />
```

---

## 7. Security review fixes applied

An architect review of the first draft caught three issues, which were fixed
before shipping:

1. **Public content leak** — the public list/detail endpoints originally let
   a caller pass an arbitrary `status` filter or look up any slug regardless
   of status, exposing draft/scheduled items. Fixed by hardcoding
   `status = "published"` on both public routes.
2. **Inconsistent delete permission** — delete was initially open to both
   `super_admin` and `editor`, unlike the Events feature's `super_admin`-only
   policy. Aligned Press delete to `super_admin` only.
3. **Loose file-type validation** — the original `fileFilter` accepted any
   image or PDF in either upload field. Fixed to validate per field:
   `newspaperImage` must be an image MIME type, `pdf` must be
   `application/pdf`.

---

## 8. Known limitation

Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
`CLOUDINARY_API_SECRET`) are **not configured** in this environment. Creating
a press item **without** attaching a file works fine; attaching an image or
PDF fails server-side with `Must supply api_key` until those secrets are set.
