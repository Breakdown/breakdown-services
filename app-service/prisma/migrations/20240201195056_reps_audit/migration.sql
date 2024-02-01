/*
  Warnings:

  - The `date_of_birth` column on the `representatives` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `next_election` column on the `representatives` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `last_updated` column on the `representatives` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[propublica_id]` on the table `representatives` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "representatives" DROP COLUMN "date_of_birth",
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
DROP COLUMN "next_election",
ADD COLUMN     "next_election" TIMESTAMP(3),
DROP COLUMN "last_updated",
ADD COLUMN     "last_updated" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "representatives_propublica_id_key" ON "representatives"("propublica_id");
