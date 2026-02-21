-- CreateTable
CREATE TABLE `medical_records` (
  `id` VARCHAR(191) NOT NULL,
  `appointmentId` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `fileType` VARCHAR(100) NOT NULL,
  `fileSize` INT NOT NULL,
  `storagePath` VARCHAR(500) NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `updatedById` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX `idx_medical_records_appointment` ON `medical_records` (`appointmentId`);
CREATE INDEX `idx_medical_records_created_at` ON `medical_records` (`created_at`);

-- Foreign Keys
ALTER TABLE `medical_records`
ADD CONSTRAINT `fk_medical_records_appointment`
  FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `medical_records`
ADD CONSTRAINT `fk_medical_records_created_by`
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `medical_records`
ADD CONSTRAINT `fk_medical_records_updated_by`
  FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

