/*
  Warnings:

  - You are about to drop the column `rx` on the `MEX` table. All the data in the column will be lost.
  - You are about to drop the `pdfMEX` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `examination_filename` to the `MEX` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pdfMEX` DROP FOREIGN KEY `pdfMEX_id_fkey`;

-- AlterTable
ALTER TABLE `MEX` DROP COLUMN `rx`,
    ADD COLUMN `examination_filename` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `pdfMEX`;

-- CreateTable
CREATE TABLE `patientRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bloodPressure` DOUBLE NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `respiratoryRate` VARCHAR(191) NOT NULL,
    `mexId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patientRecord` ADD CONSTRAINT `patientRecord_mexId_fkey` FOREIGN KEY (`mexId`) REFERENCES `MEX`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
