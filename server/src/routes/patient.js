import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { prisma } from "../prismaClient.js";
import { getWaitingTime } from "../waitingTimeService.js";
import { broadcastQueueStateForAppointment, getPatientLiveQueue } from "../queueService.js";
import { checkBookingRules } from "../validators/appointmentRules.js";
import { logAppointmentStatusChange } from "../appointmentLogger.js";

const router = express.Router();

const medicalUploadDirectory = path.join(process.cwd(), "server", "uploads", "medical-records");

const medicalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(medicalUploadDirectory, { recursive: true });
    cb(null, medicalUploadDirectory);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${base || "record"}-${timestamp}-${random}${ext}`);
  },
});

const allowedMedicalMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

const medicalUpload = multer({
  storage: medicalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMedicalMimeTypes.includes(file.mimetype)) {
      const error = new Error("INVALID_FILE_TYPE");
      cb(error);
      return;
    }
    cb(null, true);
  },
});

export function isPastTimeSlotForDate(appointmentDate, timeSlot) {
  if (!(appointmentDate instanceof Date) || Number.isNaN(appointmentDate.getTime())) {
    return false;
  }
  if (typeof timeSlot !== "string" || !timeSlot.trim()) {
    return false;
  }

  const now = new Date();
  if (
    appointmentDate.getFullYear() !== now.getFullYear() ||
    appointmentDate.getMonth() !== now.getMonth() ||
    appointmentDate.getDate() !== now.getDate()
  ) {
    return false;
  }

  const parts = timeSlot.trim().split(" ");
  if (parts.length !== 2) {
    return false;
  }
  const timePart = parts[0];
  const period = parts[1].toUpperCase();
  const [hourStr, minuteStr] = timePart.split(":");
  const hourNum = Number.parseInt(hourStr, 10);
  const minuteNum = Number.parseInt(minuteStr, 10);
  if (Number.isNaN(hourNum) || Number.isNaN(minuteNum)) {
    return false;
  }

  let hours = hourNum;
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  const slotDateTime = new Date(appointmentDate);
  slotDateTime.setHours(hours, minuteNum, 0, 0);

  return slotDateTime.getTime() < now.getTime();
}

router.use(authMiddleware, requireRole(["patient"]));

router.get("/dashboard", (req, res) => {
  return res.json({ message: "Patient dashboard data" });
});

router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        doctors: {
          where: {
            approvalStatus: "approved",
            user: {
              isApproved: true,
            },
          },
          include: {
            user: true,
          },
        },
      },
    });

    const result = departments.map((department) => ({
      id: department.id,
      name: department.name,
      doctors: department.doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.user.name,
        degrees: doctor.degrees,
      })),
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch departments" });
  }
});

router.get("/departments/:id/doctors", async (req, res) => {
  try {
    const { id } = req.params;
    const doctors = await prisma.doctor.findMany({
      where: {
        departmentId: id,
        approvalStatus: "approved",
        user: {
          isApproved: true,
        },
      },
      include: {
        user: true,
        department: true,
      },
    });
    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, departmentId, date, timeSlot, isEmergency, reasonForVisit } = req.body;

    if (!doctorId || !departmentId || !date || !timeSlot) {
      return res.status(400).json({ message: "Doctor, department, date, and time are required" });
    }

    let trimmedReason = null;
    if (typeof reasonForVisit === "string") {
      const candidate = reasonForVisit.trim();
      if (candidate.length > 0) {
        if (candidate.length < 10) {
          return res
            .status(400)
            .json({ message: "Reason for visit must be at least 10 characters" });
        }
        if (candidate.length > 500) {
          return res
            .status(400)
            .json({ message: "Reason for visit must be at most 500 characters" });
        }
        trimmedReason = candidate;
      }
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        user: true,
        department: true,
      },
    });

    if (!doctor || doctor.approvalStatus !== "approved" || !doctor.user.isApproved) {
      return res.status(400).json({ message: "Selected doctor is not available" });
    }

    const appointmentDate = new Date(date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    if (!doctor.department || doctor.department.id !== departmentId) {
      return res.status(400).json({ message: "Selected doctor does not belong to the chosen department" });
    }

    if (isPastTimeSlotForDate(appointmentDate, timeSlot)) {
      return res.status(400).json({ message: "Cannot book a past time slot" });
    }

    const existingSameDepartment = await prisma.appointment.count({
      where: {
        patientId,
        date: appointmentDate,
        status: "booked",
        doctor: {
          departmentId: departmentId,
        },
      },
    });

    const existingSameTime = await prisma.appointment.count({
      where: {
        patientId,
        date: appointmentDate,
        timeSlot,
        status: "booked",
      },
    });

    const ruleCheck = checkBookingRules({
      hasSameDept: existingSameDepartment > 0,
      hasSameTime: existingSameTime > 0,
    });

    if (!ruleCheck.allowed) {
      return res.status(409).json({ message: ruleCheck.message });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const existingForSlot = await tx.appointment.count({
        where: {
          doctorId,
          date: appointmentDate,
          timeSlot,
          status: "booked",
        },
      });

      const slotCapacity = 1;

      if (existingForSlot >= slotCapacity) {
        throw new Error("SLOT_FULL");
      }

      const queueBase = await tx.appointment.count({
        where: {
          doctorId,
          date: appointmentDate,
        },
      });

      return tx.appointment.create({
        data: {
          patientId,
          doctorId,
          date: appointmentDate,
          timeSlot,
          status: "booked",
          queueNumber: queueBase + 1,
          isEmergency: !!isEmergency,
          reasonForVisit: trimmedReason,
        },
        include: {
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });
    });

    await broadcastQueueStateForAppointment(appointment.id);

    return res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_FULL") {
      return res.status(409).json({ message: "This time slot is fully booked" });
    }
    console.error("Error booking appointment", error);
    return res.status(500).json({
      message: "Failed to book appointment",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/appointments/next", async (req, res) => {
  try {
    const patientId = req.user.id;
    const now = new Date();

    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        status: "booked",
        date: {
          gte: now,
        },
      },
      orderBy: [
        { date: "asc" },
        { queueNumber: "asc" },
      ],
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.json({ hasNextAppointment: false });
    }

    return res.json({
      hasNextAppointment: true,
      appointment: {
        id: appointment.id,
        providerName: appointment.doctor.user.name,
        datetime: appointment.date.toISOString(),
        timeSlot: appointment.timeSlot,
        location: appointment.doctor.department ? appointment.doctor.department.name : null,
        type: appointment.isEmergency ? "emergency" : "regular",
        status: appointment.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch next appointment" });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
      },
      orderBy: [
        { date: "desc" },
        { queueNumber: "desc" },
      ],
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.get("/appointments/availability", async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date || typeof doctorId !== "string" || typeof date !== "string") {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    const appointmentDate = new Date(date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: appointmentDate,
        status: "booked",
      },
      select: {
        timeSlot: true,
      },
    });

    const unavailable = Array.from(
      new Set(
        appointments
          .map((a) => a.timeSlot)
          .filter((slot) => typeof slot === "string")
      )
    );

    return res.json({ unavailable });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch availability" });
  }
});

router.get("/appointments/validate", async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, departmentId, date, timeSlot, excludeAppointmentId } = req.query;
    if (
      !doctorId ||
      !departmentId ||
      !date ||
      !timeSlot ||
      typeof doctorId !== "string" ||
      typeof departmentId !== "string" ||
      typeof date !== "string" ||
      typeof timeSlot !== "string"
    ) {
      return res.status(400).json({ allowed: false, message: "doctorId, departmentId, date and timeSlot are required" });
    }
    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ allowed: false, message: "Invalid date" });
    }

    if (isPastTimeSlotForDate(appointmentDate, timeSlot)) {
      return res.status(400).json({
        allowed: false,
        message: "Cannot book a past time slot",
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { department: true, user: true },
    });
    if (!doctor || doctor.approvalStatus !== "approved" || !doctor.user.isApproved) {
      return res.status(400).json({ allowed: false, message: "Selected doctor is not available" });
    }
    if (!doctor.department || doctor.department.id !== departmentId) {
      return res.status(400).json({ allowed: false, message: "Selected doctor does not belong to the chosen department" });
    }

    const sameDept = await prisma.appointment.count({
      where: {
        patientId,
        date: appointmentDate,
        status: "booked",
        doctor: { departmentId },
        ...(typeof excludeAppointmentId === "string"
          ? {
              NOT: {
                id: excludeAppointmentId,
              },
            }
          : {}),
      },
    });
    const sameTime = await prisma.appointment.count({
      where: {
        patientId,
        date: appointmentDate,
        timeSlot,
        status: "booked",
        ...(typeof excludeAppointmentId === "string"
          ? {
              NOT: {
                id: excludeAppointmentId,
              },
            }
          : {}),
      },
    });
    const rules = checkBookingRules({ hasSameDept: sameDept > 0, hasSameTime: sameTime > 0 });
    if (!rules.allowed) {
      return res.json({ allowed: false, message: rules.message });
    }
    return res.json({ allowed: true });
  } catch (error) {
    return res.status(500).json({ allowed: false, message: "Failed to validate appointment" });
  }
});

router.patch("/appointments/:id/cancel", async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    if (!appointment || appointment.patientId !== patientId) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "booked") {
      return res.status(400).json({ message: "Only booked appointments can be cancelled" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "cancelled",
      },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    await logAppointmentStatusChange(updated.id, appointment.status, updated.status, "PATIENT_CANCELLED");
    await broadcastQueueStateForAppointment(updated.id);

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

router.post("/appointments/:id/records", (req, res) => {
  const uploadMany = medicalUpload.array("files", 5);

  uploadMany(req, res, async (err) => {
    if (err) {
      if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: "Only PDF, JPG and PNG documents are allowed" });
      }
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        err.name === "MulterError" &&
        "code" in err
      ) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File size exceeds 5MB limit" });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({ message: "Too many files uploaded" });
        }
      }
      return res.status(400).json({ message: "Failed to upload medical records" });
    }

    try {
      const patientId = req.user.id;
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment || appointment.patientId !== patientId) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const files = Array.isArray(req.files) ? req.files : [];

      if (!files.length) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const data = files.map((file) => ({
        appointmentId: appointment.id,
        createdById: patientId,
        updatedById: patientId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storagePath: path.relative(process.cwd(), file.path),
      }));

      const created = await prisma.$transaction(async (tx) => {
        let count = 0;
        for (const record of data) {
          await tx.medicalRecord.create({ data: record });
          count += 1;
        }
        return count;
      });

      return res.status(201).json({ createdCount: created });
    } catch (error) {
      console.error("Failed to upload medical records", error);
      return res.status(500).json({ message: "Failed to upload medical records" });
    }
  });
});

router.patch("/appointments/:id/reschedule", async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!existing || existing.patientId !== patientId) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (existing.status !== "booked") {
      return res.status(400).json({ message: "Only booked appointments can be rescheduled" });
    }

    const appointmentDate = new Date(date);

    if (Number.isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    if (isPastTimeSlotForDate(appointmentDate, timeSlot)) {
      return res.status(400).json({ message: "Cannot reschedule to a past time slot" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dupSameDept = await tx.appointment.count({
        where: {
          patientId,
          date: appointmentDate,
          status: "booked",
          doctor: {
            departmentId: existing.doctor.departmentId || undefined,
          },
          NOT: { id },
        },
      });
      if (dupSameDept > 0) {
        throw new Error("DUP_DEPARTMENT");
      }

      const dupSameTime = await tx.appointment.count({
        where: {
          patientId,
          date: appointmentDate,
          timeSlot,
          status: "booked",
          NOT: { id },
        },
      });
      if (dupSameTime > 0) {
        throw new Error("DUP_TIME");
      }

      const conflictCount = await tx.appointment.count({
        where: {
          doctorId: existing.doctorId,
          date: appointmentDate,
          timeSlot,
          status: "booked",
          NOT: {
            id,
          },
        },
      });

      if (conflictCount > 0) {
        throw new Error("SLOT_FULL");
      }

      const queueBase = await tx.appointment.count({
        where: {
          doctorId: existing.doctorId,
          date: appointmentDate,
        },
      });

      return tx.appointment.update({
        where: { id },
        data: {
          date: appointmentDate,
          timeSlot,
          queueNumber: queueBase + 1,
        },
        include: {
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });
    });

    await broadcastQueueStateForAppointment(updated.id);

    return res.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_FULL") {
      return res.status(409).json({ message: "This time slot is fully booked" });
    }
    if (error instanceof Error && error.message === "DUP_DEPARTMENT") {
      return res.status(409).json({ message: "You already have an appointment in this department on this date" });
    }
    if (error instanceof Error && error.message === "DUP_TIME") {
      return res.status(409).json({ message: "You already have an appointment at this time on this date" });
    }
    return res.status(500).json({ message: "Failed to reschedule appointment" });
  }
});

router.get("/queue/live", async (req, res) => {
  try {
    const patientId = req.user.id;
    const data = await getPatientLiveQueue(patientId);
    if (!data) {
      return res.json({ hasActiveAppointment: false });
    }
    return res.json({
      hasActiveAppointment: true,
      queue: data,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load live queue" });
  }
});

router.get("/queue/:appointmentId", async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    if (!appointmentId || typeof appointmentId !== "string") {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!appointment || appointment.patientId !== patientId) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const result = await getWaitingTime(appointmentId);

    if (!result) {
      return res.json({
        position: null,
        totalAhead: 0,
        estimatedMinutes: 0,
        lastUpdated: null,
      });
    }

    return res.json({
      position: result.position,
      totalAhead: result.patientsAhead,
      estimatedMinutes: result.minutes,
      lastUpdated: result.lastUpdated,
      doctorId: result.doctorId,
      day: result.day,
      status: result.status,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load queue position" });
  }
});

router.get("/prescriptions", async (req, res) => {
  try {
    const patientId = req.user.id;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        appointment: true,
      },
    });

    const data = prescriptions.map((p) => ({
      id: p.id,
      doctorName: p.doctor.user.name,
      createdAt: p.createdAt,
      diagnosis: p.diagnosis,
      appointmentDate: p.appointment.date,
    }));

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load prescriptions" });
  }
});

export default router;
