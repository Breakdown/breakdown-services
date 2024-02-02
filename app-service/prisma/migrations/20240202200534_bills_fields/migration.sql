/*
  Warnings:

  - The `introduced_date` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `vote` on the `representative_votes` table. All the data in the column will be lost.
  - Added the required column `position` to the `representative_votes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bills" DROP COLUMN "introduced_date",
ADD COLUMN     "introduced_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "representative_votes" DROP COLUMN "vote",
ADD COLUMN     "position" TEXT NOT NULL;
