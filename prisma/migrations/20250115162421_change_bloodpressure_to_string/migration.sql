/*
  Warnings:

  - You are about to alter the column `bloodPressure` on the `patientRecord` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `patientRecord` MODIFY `bloodPressure` VARCHAR(191) NOT NULL;
