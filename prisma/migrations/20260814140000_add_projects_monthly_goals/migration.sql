-- CreateTable
CREATE TABLE `MonthlyGoal` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `targetProjects` INTEGER NOT NULL DEFAULT 0,
    `targetRevenue` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthlyGoal_tenantId_year_month_key`(`tenantId`, `year`, `month`),
    INDEX `MonthlyGoal_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `value` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativo',
    `referenceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_tenantId_idx`(`tenantId`),
    INDEX `Project_tenantId_referenceDate_idx`(`tenantId`, `referenceDate`),
    INDEX `Project_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MonthlyGoal` ADD CONSTRAINT `MonthlyGoal_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
