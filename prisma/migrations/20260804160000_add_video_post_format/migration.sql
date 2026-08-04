-- AlterTable: formato, resolução e estilo de animação configuráveis por vídeo
ALTER TABLE `VideoPost` ADD COLUMN `format` VARCHAR(191) NOT NULL DEFAULT 'vertical';
ALTER TABLE `VideoPost` ADD COLUMN `resolution` VARCHAR(191) NOT NULL DEFAULT 'fullhd';
ALTER TABLE `VideoPost` ADD COLUMN `style` VARCHAR(191) NOT NULL DEFAULT 'cinematic';
