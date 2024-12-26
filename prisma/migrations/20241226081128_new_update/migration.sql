/*
  Warnings:

  - You are about to drop the column `examination` on the `MEX` table. All the data in the column will be lost.
  - You are about to drop the `ExPhoto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ExPhoto` DROP FOREIGN KEY `ExPhoto_mexId_fkey`;

-- AlterTable
ALTER TABLE `MEX` DROP COLUMN `examination`;

-- DropTable
DROP TABLE `ExPhoto`;

-- CreateTable
CREATE TABLE `pdfMEX` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pdfMEX` ADD CONSTRAINT `pdfMEX_id_fkey` FOREIGN KEY (`id`) REFERENCES `MEX`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
