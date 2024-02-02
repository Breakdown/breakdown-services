/*
  Warnings:

  - The `last_vote` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "bills" DROP COLUMN "last_vote",
ADD COLUMN     "last_vote" TIMESTAMP(3);
