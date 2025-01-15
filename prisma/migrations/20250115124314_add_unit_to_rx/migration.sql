/*
  Warnings:

  - Added the required column `unit` to the `RxList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `RxList` ADD COLUMN `unit` VARCHAR(191) NOT NULL;
