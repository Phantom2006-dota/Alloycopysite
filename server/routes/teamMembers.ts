import { Router, Request, Response } from "express";
import { db } from "../db";
import { teamMembers } from "../../shared/schema";
import { eq, asc } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));

    res.json(members);
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/department/:department", async (req: Request, res: Response) => {
  try {
    const { department } = req.params;

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.department, department))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));

    res.json(members);
  } catch (error) {
    console.error("Get team members by department error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);

    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId));

    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("Get team member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, department, bio, profilePhoto, socialLinks, sortOrder, isActive } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const [newMember] = await db.insert(teamMembers).values({
      name,
      role,
      department,
      bio,
      profilePhoto,
      socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    res.status(201).json(newMember);
  } catch (error) {
    console.error("Create team member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);
    const { name, role, department, bio, profilePhoto, socialLinks, sortOrder, isActive } = req.body;

    const [existingMember] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId));
    if (!existingMember) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name;
    if (role) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (bio !== undefined) updates.bio = bio;
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks ? JSON.stringify(socialLinks) : null;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updatedMember] = await db.update(teamMembers).set(updates).where(eq(teamMembers.id, memberId)).returning();

    res.json(updatedMember);
  } catch (error) {
    console.error("Update team member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);

    const [existingMember] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId));
    if (!existingMember) {
      return res.status(404).json({ message: "Team member not found" });
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    res.json({ message: "Team member deleted successfully" });
  } catch (error) {
    console.error("Delete team member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const members = await db
      .select()
      .from(teamMembers)
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name));

    res.json(members);
  } catch (error) {
    console.error("Get admin team members error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
