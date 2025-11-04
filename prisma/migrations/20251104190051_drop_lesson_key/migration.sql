/*
  Warnings:

  - You are about to drop the column `lesson_key` on the `lesson` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Lesson_lesson_key_key` ON `lesson`;

-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `lesson_key`;
