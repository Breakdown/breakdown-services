-- DropIndex
DROP INDEX "bills_primary_issue_id_sponsor_id_id_house_passage_senate_p_idx";

-- CreateTable
CREATE TABLE "_RepsConstituents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RepsConstituents_AB_unique" ON "_RepsConstituents"("A", "B");

-- CreateIndex
CREATE INDEX "_RepsConstituents_B_index" ON "_RepsConstituents"("B");

-- CreateIndex
CREATE INDEX "bills_primary_issue_id_sponsor_id_id_house_passage_senate_p_idx" ON "bills"("primary_issue_id", "sponsor_id", "id", "house_passage", "senate_passage", "importance", "propublica_id");

-- AddForeignKey
ALTER TABLE "_RepsConstituents" ADD CONSTRAINT "_RepsConstituents_A_fkey" FOREIGN KEY ("A") REFERENCES "representatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RepsConstituents" ADD CONSTRAINT "_RepsConstituents_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
