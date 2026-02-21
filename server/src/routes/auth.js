import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import { prisma } from "../prismaClient.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config.js";

const router = express.Router();

const uploadDirectory = path.join(process.cwd(), "server", "uploads", "doctor-docs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${base || "document"}-${timestamp}-${random}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      const error = new Error("INVALID_FILE_TYPE");
      cb(error);
      return;
    }
    cb(null, true);
  },
});

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    languagePreference: user.languagePreference,
    isApproved: user.isApproved,
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
  };
}

router.post("/register", (req, res) => {
  const uploadSingle = upload.single("approvalDocument");

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: "Only PDF, JPG and PNG documents are allowed" });
      }
      if (err && typeof err === "object" && "name" in err && err.name === "MulterError" && "code" in err && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Document size exceeds 5MB limit" });
      }
      return res.status(400).json({ message: "Failed to upload approval document" });
    }

    (async () => {
      try {
        const {
          name,
          email,
          phone,
          password,
          role,
          languagePreference,
          departmentId,
          licenseId,
          availabilitySchedule,
          dateOfBirth,
          gender,
          degrees,
        } = req.body;

        if (!name || !email || !password || !role) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const trimmedName = typeof name === "string" ? name.trim() : "";

        if (!trimmedName) {
          return res.status(400).json({ message: "Name cannot be empty" });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
          return res.status(400).json({ message: "Invalid email address" });
        }

        if (typeof password !== "string" || password.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }

        if (!["patient", "doctor"].includes(role)) {
          return res.status(400).json({ message: "Invalid role for self-registration" });
        }

        if (!dateOfBirth) {
          return res.status(400).json({ message: "Date of birth is required" });
        }

        const dob = new Date(dateOfBirth);

        if (Number.isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth" });
        }

        const now = new Date();
        if (dob > now) {
          return res.status(400).json({ message: "Date of birth cannot be in the future" });
        }

        const minYear = now.getFullYear() - 120;
        if (dob.getFullYear() < minYear) {
          return res.status(400).json({ message: "Date of birth is unrealistically old" });
        }

        if (!gender || !["male", "female", "other"].includes(gender)) {
          return res.status(400).json({ message: "Gender must be one of male, female or other" });
        }

        if (role === "doctor") {
          if (!departmentId) {
            return res.status(400).json({ message: "Department is required for doctor registration" });
          }

          const department = await prisma.department.findUnique({
            where: { id: departmentId },
          });

          if (!department) {
            return res.status(400).json({ message: "Selected department does not exist" });
          }

          if (!req.file) {
            return res.status(400).json({ message: "Approval document is required for doctor registration" });
          }
        }

        const existing = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (existing && existing.blocked) {
          return res.status(400).json({
            message: "This email address is associated with a blocked account",
          });
        }

        if (existing) {
          return res.status(409).json({ message: "Email already in use" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const approvalDocumentPath =
          req.file && role === "doctor"
            ? path.relative(process.cwd(), req.file.path)
            : null;

        const user = await prisma.user.create({
          data: {
            name: trimmedName,
            email: trimmedEmail,
            phone: phone || null,
            passwordHash,
            role,
            languagePreference: languagePreference || "en",
            isApproved: role === "patient",
            dateOfBirth: dob,
            gender,
            doctor:
              role === "doctor"
                ? {
                    create: {
                      departmentId: departmentId || null,
                      licenseId: licenseId || null,
                      availabilitySchedule: availabilitySchedule || null,
                      approvalStatus: "pending",
                      degrees: degrees || null,
                      approvalDocumentPath,
                    },
                  }
                : undefined,
          },
          include: {
            doctor: true,
          },
        });

        if (role === "doctor") {
          return res.status(201).json({
            message: "Doctor registered, pending admin approval",
          });
        }

        const token = generateToken(user);

        return res.status(201).json({
          token,
          user: sanitizeUser(user),
        });
      } catch (error) {
        console.error("Registration error", error);
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          return res.status(409).json({ message: "Email already in use" });
        }
        return res.status(500).json({
          message: "Registration failed",
        });
      }
    })();
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctor: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.blocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked by an administrator" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "doctor") {
      if (user.doctor && user.doctor.approvalStatus === "rejected") {
        return res.status(403).json({ message: "Doctor application rejected" });
      }

      if (!user.isApproved) {
        return res.status(403).json({ message: "Doctor account pending approval" });
      }
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
});

export default router;
