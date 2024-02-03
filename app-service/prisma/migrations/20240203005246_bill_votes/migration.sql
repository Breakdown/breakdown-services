/*
  Warnings:

  - Added the required column `bill_vote_id` to the `representative_votes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "representative_votes_representative_id_bill_id_idx";

-- AlterTable
ALTER TABLE "representative_votes" ADD COLUMN     "bill_vote_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "representative_votes_representative_id_bill_vote_id_idx" ON "representative_votes"("representative_id", "bill_vote_id");

-- AddForeignKey
ALTER TABLE "representative_votes" ADD CONSTRAINT "representative_votes_bill_vote_id_fkey" FOREIGN KEY ("bill_vote_id") REFERENCES "bill_votes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
