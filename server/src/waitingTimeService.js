import { prisma } from "./prismaClient.js";
import { getQueueStateForDoctorDay } from "./queueService.js";

const providerCache = new Map();

function getProviderCacheKey(doctorId) {
  return String(doctorId);
}

async function getProviderStats(doctorId, date) {
  const key = getProviderCacheKey(doctorId);
  const cached = providerCache.get(key);
  const now = Date.now();

  if (cached && now - cached.updatedAt < 2 * 60 * 1000) {
    return cached;
  }

  const state = await getQueueStateForDoctorDay(doctorId, date);

  const entry = {
    averageMinutes: state.averageConsultationMinutes,
    delayOffsetMinutes: 0,
    updatedAt: now,
  };

  providerCache.set(key, entry);

  return entry;
}

export async function getWaitingTime(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return null;
  }

  const state = await getQueueStateForDoctorDay(appointment.doctorId, appointment.date);

  const item = state.items.find((i) => i.id === appointment.id);
  const position = item && item.position ? item.position : null;
  const patientsAhead = position && position > 0 ? position - 1 : 0;

  const providerStats = await getProviderStats(appointment.doctorId, appointment.date);

  const remainingPatients = patientsAhead;
  const baseMinutes = remainingPatients * providerStats.averageMinutes;
  const estimated = baseMinutes + providerStats.delayOffsetMinutes;
  const roundedMinutes = Math.round(estimated / 5) * 5;

  return {
    appointmentId,
    doctorId: appointment.doctorId,
    day: state.day,
    status: appointment.status,
    position,
    patientsAhead,
    minutes: roundedMinutes,
    lastUpdated: new Date().toISOString(),
  };
}
