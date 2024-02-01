-- CreateTable
CREATE TABLE "_FollowingIssues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FollowingIssues_AB_unique" ON "_FollowingIssues"("A", "B");

-- CreateIndex
CREATE INDEX "_FollowingIssues_B_index" ON "_FollowingIssues"("B");

-- AddForeignKey
ALTER TABLE "_FollowingIssues" ADD CONSTRAINT "_FollowingIssues_A_fkey" FOREIGN KEY ("A") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowingIssues" ADD CONSTRAINT "_FollowingIssues_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
