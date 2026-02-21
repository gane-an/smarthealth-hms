ALTER TABLE `users`
  ADD COLUMN `date_of_birth` datetime NULL,
  ADD COLUMN `gender` ENUM('male','female','other') NULL;

ALTER TABLE `doctors`
  ADD COLUMN `degrees` varchar(255) NULL,
  ADD COLUMN `approval_document_path` varchar(255) NULL;

CREATE INDEX `idx_doctors_department` ON `doctors` (`departmentId`);
CREATE INDEX `idx_users_role_gender` ON `users` (`role`, `gender`);
CREATE INDEX `idx_users_role_dob` ON `users` (`role`, `date_of_birth`);

