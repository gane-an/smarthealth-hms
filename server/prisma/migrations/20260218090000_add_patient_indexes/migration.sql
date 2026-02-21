CREATE INDEX `idx_appointments_patient_date_status` ON `appointments` (`patientId`, `date`, `status`);
CREATE INDEX `idx_appointments_patient_date_time_status` ON `appointments` (`patientId`, `date`, `timeSlot`, `status`);
