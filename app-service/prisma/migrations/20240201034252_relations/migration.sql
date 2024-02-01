-- CreateTable
CREATE TABLE "_BillsIssues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BillsIssues_AB_unique" ON "_BillsIssues"("A", "B");

-- CreateIndex
CREATE INDEX "_BillsIssues_B_index" ON "_BillsIssues"("B");

-- AddForeignKey
ALTER TABLE "_BillsIssues" ADD CONSTRAINT "_BillsIssues_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillsIssues" ADD CONSTRAINT "_BillsIssues_B_fkey" FOREIGN KEY ("B") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
