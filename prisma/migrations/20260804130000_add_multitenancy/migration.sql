-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tenant padrão: recebe todos os dados existentes (backfill)
INSERT INTO `Tenant` (`id`, `name`, `slug`) VALUES ('tenant_default', 'Lustosa Tech', 'lustosa-tech');

-- AdminUser -----------------------------------------------------------------
ALTER TABLE `AdminUser`
    ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default',
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'member',
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

-- Usuários existentes viram admins do tenant padrão
UPDATE `AdminUser` SET `role` = 'admin';

ALTER TABLE `AdminUser` ALTER COLUMN `tenantId` DROP DEFAULT;

DROP INDEX `AdminUser_email_key` ON `AdminUser`;
CREATE UNIQUE INDEX `AdminUser_tenantId_email_key` ON `AdminUser`(`tenantId`, `email`);
CREATE INDEX `AdminUser_email_idx` ON `AdminUser`(`email`);
ALTER TABLE `AdminUser` ADD CONSTRAINT `AdminUser_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Document ------------------------------------------------------------------
ALTER TABLE `Document` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `Document` ALTER COLUMN `tenantId` DROP DEFAULT;
CREATE INDEX `Document_tenantId_idx` ON `Document`(`tenantId`);
ALTER TABLE `Document` ADD CONSTRAINT `Document_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Conversation ----------------------------------------------------------------
ALTER TABLE `Conversation` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `Conversation` ALTER COLUMN `tenantId` DROP DEFAULT;
DROP INDEX `Conversation_waPhone_key` ON `Conversation`;
CREATE UNIQUE INDEX `Conversation_tenantId_waPhone_key` ON `Conversation`(`tenantId`, `waPhone`);
CREATE INDEX `Conversation_tenantId_idx` ON `Conversation`(`tenantId`);
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AvailabilitySlot ------------------------------------------------------------
ALTER TABLE `AvailabilitySlot` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `AvailabilitySlot` ALTER COLUMN `tenantId` DROP DEFAULT;
CREATE INDEX `AvailabilitySlot_tenantId_idx` ON `AvailabilitySlot`(`tenantId`);
ALTER TABLE `AvailabilitySlot` ADD CONSTRAINT `AvailabilitySlot_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Meeting ---------------------------------------------------------------------
ALTER TABLE `Meeting` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `Meeting` ALTER COLUMN `tenantId` DROP DEFAULT;
CREATE INDEX `Meeting_tenantId_idx` ON `Meeting`(`tenantId`);
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Setting: chave primária composta (tenantId, key) ------------------------------
ALTER TABLE `Setting` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `Setting` ALTER COLUMN `tenantId` DROP DEFAULT;
ALTER TABLE `Setting` DROP PRIMARY KEY, ADD PRIMARY KEY (`tenantId`, `key`);
ALTER TABLE `Setting` ADD CONSTRAINT `Setting_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- News --------------------------------------------------------------------------
ALTER TABLE `News` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `News` ALTER COLUMN `tenantId` DROP DEFAULT;
DROP INDEX `News_slug_key` ON `News`;
CREATE UNIQUE INDEX `News_tenantId_slug_key` ON `News`(`tenantId`, `slug`);
CREATE INDEX `News_tenantId_idx` ON `News`(`tenantId`);
ALTER TABLE `News` ADD CONSTRAINT `News_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- VideoPost -----------------------------------------------------------------------
ALTER TABLE `VideoPost` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'tenant_default';
ALTER TABLE `VideoPost` ALTER COLUMN `tenantId` DROP DEFAULT;
CREATE INDEX `VideoPost_tenantId_idx` ON `VideoPost`(`tenantId`);
ALTER TABLE `VideoPost` ADD CONSTRAINT `VideoPost_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
