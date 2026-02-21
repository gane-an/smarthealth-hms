import { prisma } from "./prismaClient.js";

export async function logAppointmentStatusChange(appointmentId, fromStatus, toStatus, reason) {
  try {
    await prisma.appointmentLog.create({
      data: {
        appointmentId,
        fromStatus: fromStatus || null,
        toStatus,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error("Failed to log appointment status change", {
      appointmentId,
      fromStatus,
      toStatus,
      reason,
      error,
    });
  }
}

