CREATE TABLE `medical_records` (
  `id` VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileType` VARCHAR(191) NOT NULL,
  `fileSize` INT NOT NULL,
  `storagePath` VARCHAR(191) NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `updatedById` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_medical_records_appointment` ON `medical_records` (`appointmentId`);
CREATE INDEX `idx_medical_records_created_at` ON `medical_records` (`created_at`);

ALTER TABLE `medical_records`
ADD CONSTRAINT `medical_records_appointmentId_fkey`
  FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medical_records`
ADD CONSTRAINT `medical_records_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `medical_records`
ADD CONSTRAINT `medical_records_updatedById_fkey`
  FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

