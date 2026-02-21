import express from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../prismaClient.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

router.get("/doctors/pending", async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "doctor",
        isApproved: false,
        doctor: {
          is: {
            approvalStatus: "pending",
          },
        },
      },
      include: {
        doctor: {
          include: {
            department: true,
            user: true,
          },
        },
      },
    });
    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending doctors" });
  }
});

router.post("/doctors/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
    });

    await prisma.doctor.updateMany({
      where: { userId: id },
      data: { approvalStatus: "approved" },
    });

    const result = await prisma.user.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { department: true },
        },
      },
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to approve doctor" });
  }
});

router.post("/doctors/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.doctor.updateMany({
      where: { userId: id },
      data: { approvalStatus: "rejected" },
    });

    const result = await prisma.user.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { department: true },
        },
      },
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to reject doctor" });
  }
});

router.get("/doctors/:id/document", async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findFirst({
      where: {
        userId: id,
      },
    });

    if (!doctor || !doctor.approvalDocumentPath) {
      return res.status(404).json({ message: "Approval document not found" });
    }

    const absolutePath = path.isAbsolute(doctor.approvalDocumentPath)
      ? doctor.approvalDocumentPath
      : path.join(process.cwd(), doctor.approvalDocumentPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Approval document not found" });
    }

    return res.sendFile(absolutePath);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load approval document" });
  }
});

router.get("/doctors", async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: true,
        department: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });
    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

router.patch("/doctors/:doctorId/assign", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { departmentId, licenseId, availabilitySchedule } = req.body;

    const updateData = {};

    if (departmentId !== undefined) {
      updateData.departmentId = departmentId || null;
    }
    if (licenseId !== undefined) {
      updateData.licenseId = licenseId || null;
    }
    if (availabilitySchedule !== undefined) {
      updateData.availabilitySchedule = availabilitySchedule || null;
    }

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
      include: {
        user: true,
        department: true,
      },
    });

    return res.json(doctor);
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign doctor" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        doctors: {
          include: {
            user: true,
          },
        },
      },
    });
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
});

router.post("/departments", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const department = await prisma.department.create({
      data: { name },
    });
    return res.status(201).json(department);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create department" });
  }
});

router.put("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const department = await prisma.department.update({
      where: { id },
      data: { name },
    });
    return res.json(department);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update department" });
  }
});

router.delete("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doctorCount = await prisma.doctor.count({
      where: { departmentId: id },
    });

    if (doctorCount > 0) {
      return res.status(400).json({ message: "Cannot delete department with assigned doctors" });
    }

    await prisma.department.delete({
      where: { id },
    });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete department" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== "boolean") {
      return res.status(400).json({ message: "isApproved must be boolean" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin account cannot be modified" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user status" });
  }
});

router.patch("/users/:id/block", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin account cannot be blocked" });
    }

    if (user.blocked) {
      return res.json(user);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        blocked: true,
      },
    });

    await prisma.userAuditLog.create({
      data: {
        userId: updated.id,
        performedById: adminId,
        action: "block",
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to block user" });
  }
});

router.patch("/users/:id/unblock", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin account cannot be unblocked" });
    }

    if (!user.blocked) {
      return res.json(user);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        blocked: false,
      },
    });

    await prisma.userAuditLog.create({
      data: {
        userId: updated.id,
        performedById: adminId,
        action: "unblock",
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to unblock user" });
  }
});

export default router;
