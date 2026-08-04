-- AlterTable: campos do pipeline no VideoPost
ALTER TABLE `VideoPost`
    ADD COLUMN `finalVideoUrl` VARCHAR(191) NULL,
    ADD COLUMN `error` TEXT NULL;

-- CreateTable: roteiro gerado por IA (campo grande para até ~1h de conteúdo)
CREATE TABLE `VideoScript` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `videoPostId` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ready',
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VideoScript_videoPostId_key`(`videoPostId`),
    INDEX `VideoScript_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: prompts de vídeo (cenas sequenciais do roteiro)
CREATE TABLE `VideoPrompt` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `scriptId` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `prompt` TEXT NOT NULL,
    `narration` TEXT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `audioUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VideoPrompt_scriptId_sequence_key`(`scriptId`, `sequence`),
    INDEX `VideoPrompt_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VideoScript` ADD CONSTRAINT `VideoScript_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VideoScript` ADD CONSTRAINT `VideoScript_videoPostId_fkey` FOREIGN KEY (`videoPostId`) REFERENCES `VideoPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VideoPrompt` ADD CONSTRAINT `VideoPrompt_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VideoPrompt` ADD CONSTRAINT `VideoPrompt_scriptId_fkey` FOREIGN KEY (`scriptId`) REFERENCES `VideoScript`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
