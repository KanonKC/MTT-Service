/*
  Warnings:

  - You are about to drop the column `class` on the `lesson` table. All the data in the column will be lost.
  - Added the required column `class_level` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `lesson` DROP COLUMN `class`,
    ADD COLUMN `class_level` INTEGER NOT NULL;
