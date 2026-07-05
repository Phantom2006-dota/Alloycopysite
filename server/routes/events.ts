// [file name]: events.ts
// [file content begin]
import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { events } from "../../shared/schema";
import { eq, desc, and, gte, lt, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../lib/cloudinary";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Debug route to test database connection
router.get("/debug/test-db", async (_req: Request, res: Response) => {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(events);
    console.log('Events database test successful:', result);

    res.json({ 
      dbConnected: true,
      eventCount: result[0].count 
    });
  } catch (error) {
    console.error('Events database test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "12", status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];

    if (status && status !== "all") {
      conditions.push(eq(events.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const eventsList = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(desc(events.eventDate))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(whereClause);

    res.json({
      events: eventsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/upcoming", async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const upcomingEvents = await db
      .select()
      .from(events)
      .where(and(eq(events.status, "upcoming"), gte(events.eventDate, now)))
      .orderBy(events.eventDate)
      .limit(10);

    res.json(upcomingEvents);
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/past", async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const pastEvents = await db
      .select()
      .from(events)
      .where(lt(events.eventDate, now))
      .orderBy(desc(events.eventDate))
      .limit(10);

    res.json(pastEvents);
  } catch (error) {
    console.error("Get past events error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [event] = await db.select().from(events).where(eq(events.slug, slug));

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor"), upload.single("featuredImage"), async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== EVENT CREATE REQUEST START ===');
    console.log('Request body fields:', Object.keys(req.body));
    console.log('Request body values:', req.body);
    console.log('Has file:', !!req.file);

    const { 
      title, description, eventDate, endDate, location, 
      isVirtual, virtualLink, registrationLink, 
      eventType, status 
    } = req.body;

    console.log('Parsed fields:', { 
      title, eventDate, location, eventType,
      isVirtual: isVirtual,
      isVirtualType: typeof isVirtual
    });

    if (!title || !eventDate) {
      console.log('Validation failed: Missing title or eventDate');
      return res.status(400).json({ message: "Title and event date are required" });
    }

    let featuredImageUrl = req.body.featuredImage || null;

    // Handle file upload if present
    if (req.file) {
      try {
        console.log('Starting Cloudinary upload for event...');
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'bauhaus-cms/events',
          resource_type: 'image',
        });
        featuredImageUrl = uploadResult.secure_url;
        console.log('Cloudinary upload successful:', featuredImageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", details: uploadError.message });
      }
    }

    const slug = generateSlug(title);
    console.log('Generated slug:', slug);

    // Handle boolean conversion
    const isVirtualBool = isVirtual === 'true' || isVirtual === true || false;

    // Prepare the data for insertion
    const insertData = {
      title,
      slug,
      description: description || null,
      eventDate: new Date(eventDate),
      endDate: endDate ? new Date(endDate) : null,
      location: location || null,
      isVirtual: isVirtualBool,
      virtualLink: virtualLink || null,
      featuredImage: featuredImageUrl,
      registrationLink: registrationLink || null,
      eventType: eventType || null,
      status: status || "upcoming",
    };

    console.log('Final insert data:', JSON.stringify(insertData, null, 2));

    const [newEvent] = await db.insert(events).values(insertData).returning();

    console.log('✅ Event created successfully! ID:', newEvent.id);
    console.log('=== EVENT CREATE REQUEST END ===');

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("❌ Create event error:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);

    // Check for specific database errors
    if (error.message?.includes('unique constraint')) {
      return res.status(400).json({ 
        message: "Slug already exists. Please use a different title.",
        error: error.message 
      });
    }

    if (error.message?.includes('violates not-null constraint')) {
      return res.status(400).json({ 
        message: "Missing required field", 
        error: error.message 
      });
    }

    if (error.message?.includes('invalid input syntax')) {
      return res.status(400).json({ 
        message: "Invalid date format", 
        error: error.message 
      });
    }

    res.status(500).json({ 
      message: "Failed to create event", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor"), upload.single("featuredImage"), async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== EVENT UPDATE REQUEST START ===');
    const { id } = req.params;
    const eventId = parseInt(id);
    const { 
      title, description, eventDate, endDate, location, 
      isVirtual, virtualLink, registrationLink, 
      eventType, status 
    } = req.body;

    console.log('Updating event ID:', eventId);
    console.log('Request body:', req.body);
    console.log('Has file:', !!req.file);

    const [existingEvent] = await db.select().from(events).where(eq(events.id, eventId));
    if (!existingEvent) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    let featuredImageUrl = req.body.featuredImage !== undefined ? req.body.featuredImage : existingEvent.featuredImage;

    // Handle file upload if present
    if (req.file) {
      try {
        console.log('Uploading new featured image...');
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'bauhaus-cms/events',
          resource_type: 'image',
        });
        featuredImageUrl = uploadResult.secure_url;
        console.log('New featured image uploaded:', featuredImageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", details: uploadError.message });
      }
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (title) {
      updates.title = title;
      updates.slug = generateSlug(title);
    }
    if (description !== undefined) updates.description = description;
    if (eventDate) updates.eventDate = new Date(eventDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (location !== undefined) updates.location = location;
    if (isVirtual !== undefined) updates.isVirtual = isVirtual === 'true' || isVirtual === true;
    if (virtualLink !== undefined) updates.virtualLink = virtualLink;
    if (featuredImageUrl !== undefined) updates.featuredImage = featuredImageUrl;
    if (registrationLink !== undefined) updates.registrationLink = registrationLink;
    if (eventType !== undefined) updates.eventType = eventType;
    if (status) updates.status = status;

    console.log('Applying updates:', updates);

    const [updatedEvent] = await db.update(events).set(updates).where(eq(events.id, eventId)).returning();

    console.log('✅ Event updated successfully!');
    console.log('=== EVENT UPDATE REQUEST END ===');

    res.json(updatedEvent);
  } catch (error) {
    console.error("❌ Update event error:", error);
    console.error("Full error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);

    const [existingEvent] = await db.select().from(events).where(eq(events.id, eventId));
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    await db.delete(events).where(eq(events.id, eventId));

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const eventsList = await db
      .select()
      .from(events)
      .orderBy(desc(events.eventDate));

    res.json(eventsList);
  } catch (error) {
    console.error("Get admin events error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
// [file content end]