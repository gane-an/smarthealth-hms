import { prisma } from "./prismaClient.js";
import { broadcastQueueStateForAppointment } from "./queueService.js";
import { isPastTimeSlotForDate } from "./utils/timeSlots.js";
import { logAppointmentStatusChange } from "./appointmentLogger.js";

async function cancelExpiredAppointments() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const expiredByDate = await prisma.appointment.findMany({
    where: {
      status: "booked",
      date: {
        lt: startOfToday,
      },
    },
    select: {
      id: true,
      status: true,
      doctorId: true,
      date: true,
      timeSlot: true,
    },
  });

  const candidatesToday = await prisma.appointment.findMany({
    where: {
      status: "booked",
      date: {
        gte: startOfToday,
        lte: now,
      },
    },
    select: {
      id: true,
      status: true,
      doctorId: true,
      date: true,
      timeSlot: true,
    },
  });

  const expiredToday = candidatesToday.filter((apt) => {
    const day = new Date(apt.date);
    day.setHours(0, 0, 0, 0);
    return isPastTimeSlotForDate(day, apt.timeSlot);
  });

  const allExpired = [...expiredByDate, ...expiredToday];

  for (const apt of allExpired) {
    try {
      const updated = await prisma.appointment.update({
        where: { id: apt.id },
        data: {
          status: "cancelled",
          notes: "AUTO_NO_SHOW",
        },
      });

      await logAppointmentStatusChange(
        updated.id,
        apt.status,
        updated.status,
        "AUTO_NO_SHOW",
      );

      await broadcastQueueStateForAppointment(updated.id);
    } catch (error) {
      console.error("Failed to auto-cancel expired appointment", {
        appointmentId: apt.id,
        error,
      });
    }
  }
}

async function deleteOldCancelledAppointments() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 7);

  const oldCancelled = await prisma.appointment.findMany({
    where: {
      status: "cancelled",
      date: {
        lt: cutoff,
      },
    },
    include: {
      _count: {
        select: {
          prescriptions: true,
        },
      },
    },
  });

  if (oldCancelled.length === 0) {
    return;
  }

  const ids = oldCancelled.filter((a) => a._count.prescriptions === 0).map((a) => a.id);

  if (ids.length === 0) {
    return;
  }

  try {
    await prisma.appointment.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  } catch (error) {
    console.error("Failed to delete old cancelled appointments", {
      ids,
      error,
    });
  }
}

async function runLifecycleTick() {
  try {
    await cancelExpiredAppointments();
    await deleteOldCancelledAppointments();
  } catch (error) {
    console.error("Error running appointment lifecycle tick", error);
  }
}

export function startAppointmentLifecycleScheduler() {
  runLifecycleTick();
  setInterval(runLifecycleTick, 60 * 1000);
}
