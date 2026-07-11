import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import {
  generateToken,
  authenticateToken,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Always hash password on registration
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        password: hashedPassword,
        name,
        role: "contributor",
        isActive: true,
      })
      .returning();

    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        bio: user.bio,
        profileImage: user.profileImage,
        socialLinks: user.socialLinks,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ADD THIS NEW ROUTE: Password reset endpoint for admin
router.post(
  "/reset-password",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, newPassword } = req.body;

      if (
        !req.user ||
        (req.user.role !== "super_admin" && req.user.id !== parseInt(userId))
      ) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!newPassword || newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, parseInt(userId)));

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ADD THIS NEW ROUTE: Update user profile
router.put(
  "/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, email, bio, profileImage, socialLinks } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (bio !== undefined) updates.bio = bio;
      if (profileImage !== undefined) updates.profileImage = profileImage;
      if (socialLinks !== undefined) updates.socialLinks = socialLinks;

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.user.id))
        .returning();

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profileImage: updatedUser.profileImage,
        socialLinks: updatedUser.socialLinks,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
