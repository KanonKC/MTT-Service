/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `lesson` ADD COLUMN `key` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Lesson_key_key` ON `Lesson`(`key`);
