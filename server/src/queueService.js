import { prisma } from "./prismaClient.js";
import { getIo } from "./realtime.js";

function getDayRange(date) {
  const d = new Date(date);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getQueueRoom(doctorId, date) {
  const d = new Date(date);
  const dayKey = d.toISOString().slice(0, 10);
  return `queue:${doctorId}:${dayKey}`;
}

async function getAverageConsultationMinutes(tx) {
  const client = tx || prisma;
  try {
    const config = await client.systemConfig.findUnique({
      where: { key: "average_consultation_minutes" },
    });
    const parsed = config ? parseInt(config.value, 10) : Number.NaN;
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
  }
  return 10;
}

export async function getQueueStateForDoctorDay(doctorId, date, tx) {
  const client = tx || prisma;
  const { start, end } = getDayRange(date);

  const appointments = await client.appointment.findMany({
    where: {
      doctorId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [
      { queueNumber: "asc" },
      { date: "asc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      queueNumber: true,
      status: true,
      isEmergency: true,
      timeSlot: true,
      patient: {
        select: {
          name: true,
        },
      },
    },
  });

  const booked = appointments.filter((a) => a.status === "booked");
  const completed = appointments.filter((a) => a.status === "completed");

  const positionMap = {};
  let positionCounter = 1;
  for (const apt of booked) {
    positionMap[apt.id] = positionCounter;
    positionCounter += 1;
  }

  const items = appointments.map((apt) => ({
    id: apt.id,
    queueNumber: apt.queueNumber,
    status: apt.status,
    isEmergency: apt.isEmergency,
    position: positionMap[apt.id] || null,
    timeSlot: apt.timeSlot,
    patientName: apt.patient ? apt.patient.name : null,
  }));

  const inConsultation = appointments.find((a) => a.status === "in_consultation") || null;
  const currentServing = inConsultation || (booked.length > 0 ? booked[0] : null);

  const averageMinutes = await getAverageConsultationMinutes(client);

  return {
    doctorId,
    day: getDayRange(date).start.toISOString().slice(0, 10),
    items,
    currentServingId: currentServing ? currentServing.id : null,
    currentServingQueueNumber: currentServing ? currentServing.queueNumber : null,
    waitingCount: booked.length,
    completedCount: completed.length,
    averageConsultationMinutes: averageMinutes,
  };
}

export async function broadcastQueueStateForAppointment(appointmentId) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      return;
    }
    const state = await getQueueStateForDoctorDay(appointment.doctorId, appointment.date);
    const io = getIo();
    if (!io) {
      return;
    }
    const room = getQueueRoom(appointment.doctorId, appointment.date);
    io.to(room).emit("queue:update", state);
    console.log("Queue update broadcast", {
      doctorId: appointment.doctorId,
      day: state.day,
      waitingCount: state.waitingCount,
      completedCount: state.completedCount,
    });
  } catch (error) {
    console.error("Failed to broadcast queue state", error);
  }
}

export async function getPatientLiveQueue(patientId) {
  const now = new Date();
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      status: {
        in: ["booked", "in_consultation"],
      },
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
    return null;
  }

  const state = await getQueueStateForDoctorDay(appointment.doctorId, appointment.date);

  const item = state.items.find((i) => i.id === appointment.id);
  const position = item && item.position ? item.position : null;
  const patientsAhead = position && position > 0 ? position - 1 : 0;
  const remainingPatients = patientsAhead;
  const estimatedWaitingMinutes = remainingPatients * state.averageConsultationMinutes;

  return {
    appointmentId: appointment.id,
    status: appointment.status,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor.user.name,
    departmentName: appointment.doctor.department ? appointment.doctor.department.name : null,
    date: appointment.date.toISOString(),
    timeSlot: appointment.timeSlot,
    isEmergency: appointment.isEmergency,
    queueNumber: appointment.queueNumber,
    position,
    patientsAhead,
    remainingPatients,
    currentServingQueueNumber: state.currentServingQueueNumber,
    waitingCount: state.waitingCount,
    completedCount: state.completedCount,
    estimatedWaitingMinutes,
    estimatedWaitingSeconds: estimatedWaitingMinutes * 60,
    averageConsultationMinutes: state.averageConsultationMinutes,
    day: state.day,
  };
}
