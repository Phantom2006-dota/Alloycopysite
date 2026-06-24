import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const BLOG_DIR = path.resolve(__dirname, "../../html-blog-pages");
const MANIFEST_PATH = path.join(BLOG_DIR, "manifest.json");

function readManifest(): any[] {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeManifest(data: any[]) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2), "utf-8");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, BLOG_DIR),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/html" || file.originalname.endsWith(".html")) {
      cb(null, true);
    } else {
      cb(new Error("Only HTML files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", (_req: Request, res: Response) => {
  const posts = readManifest();
  res.json(posts);
});

router.post("/", upload.single("file"), (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No HTML file provided" });

    const { title, slug, description, category } = req.body;
    if (!title || !slug) return res.status(400).json({ message: "Title and slug are required" });

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const targetName = `${safeSlug}.html`;
    const targetPath = path.join(BLOG_DIR, targetName);

    if (req.file.originalname !== targetName) {
      fs.renameSync(req.file.path, targetPath);
    }

    const posts = readManifest();
    const existing = posts.findIndex((p: any) => p.slug === safeSlug);
    const entry = {
      slug: safeSlug,
      title,
      description: description || "",
      category: category || "General",
      publishedAt: new Date().toISOString().split("T")[0],
      filename: targetName,
    };

    if (existing >= 0) {
      posts[existing] = entry;
    } else {
      posts.unshift(entry);
    }

    writeManifest(posts);
    res.json({ message: "Blog post published", post: entry });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:slug", (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const posts = readManifest();
    const idx = posts.findIndex((p: any) => p.slug === slug);
    if (idx === -1) return res.status(404).json({ message: "Post not found" });

    const post = posts[idx];
    const filePath = path.join(BLOG_DIR, post.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    posts.splice(idx, 1);
    writeManifest(posts);
    res.json({ message: "Post deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
