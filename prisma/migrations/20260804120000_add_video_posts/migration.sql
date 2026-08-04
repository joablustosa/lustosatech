-- CreateTable
CREATE TABLE `VideoPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `platformInstagram` BOOLEAN NOT NULL DEFAULT false,
    `platformYoutube` BOOLEAN NOT NULL DEFAULT false,
    `platformTiktok` BOOLEAN NOT NULL DEFAULT false,
    `platformKwai` BOOLEAN NOT NULL DEFAULT false,
    `autoSend` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoPost_scheduledAt_idx`(`scheduledAt`),
    INDEX `VideoPost_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
