/*
  Warnings:

  - You are about to drop the column `key` on the `lesson` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lesson_key]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.
  - The required column `lesson_key` was added to the `Lesson` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX `Lesson_key_key` ON `lesson`;

-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `key`,
    ADD COLUMN `lesson_key` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Lesson_lesson_key_key` ON `Lesson`(`lesson_key`);
