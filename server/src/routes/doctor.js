import express from "express";
import fs from "fs";
import path from "path";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { prisma } from "../prismaClient.js";
import { broadcastQueueStateForAppointment, getQueueStateForDoctorDay } from "../queueService.js";
import { logAppointmentStatusChange } from "../appointmentLogger.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["doctor"]));

router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todaysAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["booked", "in_consultation", "completed"],
        },
      },
    });

    return res.json({
      todaysAppointments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: [
        { date: "asc" },
        { queueNumber: "asc" },
      ],
      include: {
        patient: true,
      },
    });

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.get("/appointments/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointment" });
  }
});

router.get("/appointments/:id/records", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const records = await prisma.medicalRecord.findMany({
      where: {
        appointmentId: appointment.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch medical records" });
  }
});

router.get("/appointments/:appointmentId/records/:recordId/download", async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, recordId } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.appointmentId !== appointment.id) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    const absolutePath = path.isAbsolute(record.storagePath)
      ? record.storagePath
      : path.join(process.cwd(), record.storagePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Content-Type", record.fileType);
    return res.download(absolutePath, record.fileName);
  } catch (error) {
    return res.status(500).json({ message: "Failed to download medical record" });
  }
});

router.patch("/appointments/:id/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["booked", "in_consultation", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    const fromStatus = existing.status;

    if (fromStatus === "completed" || fromStatus === "cancelled") {
      return res.status(400).json({ message: "Completed or cancelled appointments cannot be updated" });
    }

    if (status === "completed" && fromStatus !== "in_consultation") {
      return res.status(400).json({ message: "Appointment must be in consultation before marking as completed" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    await logAppointmentStatusChange(appointment.id, fromStatus, appointment.status, "DOCTOR_STATUS_UPDATE");
    await broadcastQueueStateForAppointment(appointment.id);

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update appointment status" });
  }
});

router.patch("/appointments/:id/not-presented", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctor.id) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (existing.status !== "booked" && existing.status !== "in_consultation") {
      return res.status(400).json({ message: "Only active appointments can be marked as not presented" });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "cancelled",
        notes: "NOT_PRESENTED",
      },
    });

    await logAppointmentStatusChange(appointment.id, existing.status, appointment.status, "NOT_PRESENTED");
    await broadcastQueueStateForAppointment(appointment.id);

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark appointment as not presented" });
  }
});

router.get("/queue/today", async (req, res) => {
  try {
    const userId = req.user.id;

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const now = new Date();
    const state = await getQueueStateForDoctorDay(doctor.id, now);

    let currentServingAppointment = null;

    if (state.currentServingId) {
      currentServingAppointment = await prisma.appointment.findUnique({
        where: { id: state.currentServingId },
        include: {
          patient: true,
        },
      });
    }

    return res.json({
      ...state,
      currentServingAppointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load queue" });
  }
});

router.post("/prescriptions", async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId, patientId, diagnosis, medicines } = req.body;

    if (!appointmentId || !patientId) {
      return res.status(400).json({ message: "appointmentId and patientId are required" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== doctor.id || appointment.patientId !== patientId) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const medicinesJson = Array.isArray(medicines) ? JSON.stringify(medicines) : null;

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId,
        doctorId: doctor.id,
        patientId,
        diagnosis: diagnosis && typeof diagnosis === "string" ? diagnosis : null,
        medicinesJson,
      },
    });

    return res.status(201).json(prescription);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create prescription" });
  }
});

export default router;
