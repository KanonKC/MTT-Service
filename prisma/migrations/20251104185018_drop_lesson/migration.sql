/*
  Warnings:

  - You are about to drop the `lesson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `lesson` DROP FOREIGN KEY `Lesson_book_id_fkey`;

-- DropTable
DROP TABLE `lesson`;
