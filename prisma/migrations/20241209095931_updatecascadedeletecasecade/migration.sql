-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fName` VARCHAR(191) NOT NULL,
    `lName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `medicalCerId` INTEGER NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicalCer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicalLicense` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MEX` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `docID` INTEGER NOT NULL,
    `hn` INTEGER NOT NULL,
    `chiefComplaint` VARCHAR(191) NOT NULL,
    `presentHistory` VARCHAR(191) NOT NULL,
    `examination` VARCHAR(191) NOT NULL,
    `dx` VARCHAR(191) NOT NULL,
    `rx` VARCHAR(191) NOT NULL,
    `procedure` VARCHAR(191) NOT NULL,
    `appointment` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RxList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hn` INTEGER NOT NULL,
    `medicalName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `use` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `mexId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `photo` VARCHAR(191) NOT NULL,
    `mexId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_medicalCerId_fkey` FOREIGN KEY (`medicalCerId`) REFERENCES `MedicalCer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MEX` ADD CONSTRAINT `MEX_docID_fkey` FOREIGN KEY (`docID`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RxList` ADD CONSTRAINT `RxList_mexId_fkey` FOREIGN KEY (`mexId`) REFERENCES `MEX`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExPhoto` ADD CONSTRAINT `ExPhoto_mexId_fkey` FOREIGN KEY (`mexId`) REFERENCES `MEX`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
