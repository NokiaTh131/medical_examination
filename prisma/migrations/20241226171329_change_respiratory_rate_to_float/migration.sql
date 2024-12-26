/*
  Warnings:

  - You are about to alter the column `respiratoryRate` on the `patientRecord` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Double`.

*/
-- AlterTable
ALTER TABLE `patientRecord` MODIFY `respiratoryRate` DOUBLE NOT NULL;
