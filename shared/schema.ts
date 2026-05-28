import { pgTable, text, serial, integer, bigint, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'editor', 'author', 'contributor']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'scheduled', 'archived']);
export const mediaTypeEnum = pgEnum('media_type', ['book', 'film', 'tv']);
export const eventStatusEnum = pgEnum('event_status', ['upcoming', 'ongoing', 'past']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default('contributor').notNull(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  socialLinks: text("social_links"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  featuredImageAlt: varchar("featured_image_alt", { length: 255 }),
  authorId: integer("author_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  status: contentStatusEnum("status").default('draft').notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isSticky: boolean("is_sticky").default(false).notNull(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  readingTime: integer("reading_time"),
  viewCount: integer("view_count").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articleTags = pgTable("article_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: 'cascade' }).notNull(),
});

export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  type: mediaTypeEnum("type").notNull(),
  coverImage: text("cover_image"),
  releaseDate: timestamp("release_date"),
  genre: varchar("genre", { length: 255 }),
  castInfo: text("cast_info"),
  authorInfo: text("author_info"),
  externalLinks: text("external_links"),
  trailerUrl: text("trailer_url"),
  galleryImages: text("gallery_images"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  status: contentStatusEnum("status").default('draft').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  bio: text("bio"),
  profilePhoto: text("profile_photo"),
  socialLinks: text("social_links"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  isVirtual: boolean("is_virtual").default(false).notNull(),
  virtualLink: text("virtual_link"),
  featuredImage: text("featured_image"),
  registrationLink: text("registration_link"),
  eventType: varchar("event_type", { length: 100 }),
  status: eventStatusEnum("status").default('upcoming').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  alt: varchar("alt", { length: 255 }),
  folder: varchar("folder", { length: 255 }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).unique().notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: bigint("price", { mode: "number" }).notNull(),
  compareAtPrice: bigint("compare_at_price", { mode: "number" }),
  sku: varchar("sku", { length: 100 }),
  categoryId: integer("category_id").references(() => productCategories.id),
  images: text("images"),
  featuredImage: text("featured_image"),
  stock: integer("stock").default(0).notNull(),
  isInStock: boolean("is_in_stock").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  status: productStatusEnum("status").default('draft').notNull(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  provenance: text("provenance"),
  technique: text("technique"),
  historicalContext: text("historical_context"),
  novelExcerpt: text("novel_excerpt"),
  makerStory: text("maker_story"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  uploads: many(uploads),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  articleTags: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  uploader: one(users, {
    fields: [uploads.uploadedBy],
    references: [users.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export type ArticleTag = typeof articleTags.$inferSelect;
export type InsertArticleTag = typeof articleTags.$inferInsert;
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = typeof mediaItems.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
