/*
  Warnings:

  - The `house_passage` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `senate_passage` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `enacted` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `vetoed` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `latest_major_action_date` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "bills" DROP COLUMN "house_passage",
ADD COLUMN     "house_passage" TIMESTAMP(3),
DROP COLUMN "senate_passage",
ADD COLUMN     "senate_passage" TIMESTAMP(3),
DROP COLUMN "enacted",
ADD COLUMN     "enacted" TIMESTAMP(3),
DROP COLUMN "vetoed",
ADD COLUMN     "vetoed" TIMESTAMP(3),
DROP COLUMN "latest_major_action_date",
ADD COLUMN     "latest_major_action_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "bills_primary_issue_id_sponsor_id_id_house_passage_senate_p_idx" ON "bills"("primary_issue_id", "sponsor_id", "id", "house_passage", "senate_passage", "importance");
