-- Alter appointment status enum to add in_consultation
ALTER TABLE `appointments`
MODIFY `status` ENUM('booked', 'in_consultation', 'completed', 'cancelled') NOT NULL DEFAULT 'booked';

-- Create appointment_logs table for audit trail
CREATE TABLE `appointment_logs` (
  `id` VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191) NOT NULL,
  `fromStatus` ENUM('booked', 'in_consultation', 'completed', 'cancelled') NULL,
  `toStatus` ENUM('booked', 'in_consultation', 'completed', 'cancelled') NOT NULL,
  `reason` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_appointment_logs_appointment` ON `appointment_logs` (`appointmentId`);

ALTER TABLE `appointment_logs`
ADD CONSTRAINT `appointment_logs_appointmentId_fkey`
  FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

