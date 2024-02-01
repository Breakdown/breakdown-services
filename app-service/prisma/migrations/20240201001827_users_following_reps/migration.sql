-- CreateTable
CREATE TABLE "_FollowingReps" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FollowingReps_AB_unique" ON "_FollowingReps"("A", "B");

-- CreateIndex
CREATE INDEX "_FollowingReps_B_index" ON "_FollowingReps"("B");

-- AddForeignKey
ALTER TABLE "_FollowingReps" ADD CONSTRAINT "_FollowingReps_A_fkey" FOREIGN KEY ("A") REFERENCES "representatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowingReps" ADD CONSTRAINT "_FollowingReps_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
