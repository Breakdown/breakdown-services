-- CreateTable
CREATE TABLE "_FollowingBills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FollowingBills_AB_unique" ON "_FollowingBills"("A", "B");

-- CreateIndex
CREATE INDEX "_FollowingBills_B_index" ON "_FollowingBills"("B");

-- AddForeignKey
ALTER TABLE "_FollowingBills" ADD CONSTRAINT "_FollowingBills_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowingBills" ADD CONSTRAINT "_FollowingBills_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
