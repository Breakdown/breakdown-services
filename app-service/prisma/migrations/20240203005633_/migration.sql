/*
  Warnings:

  - A unique constraint covering the columns `[representative_id,bill_vote_id,bill_id]` on the table `representative_votes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "representative_votes_representative_id_bill_vote_id_bill_id_key" ON "representative_votes"("representative_id", "bill_vote_id", "bill_id");
