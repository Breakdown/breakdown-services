-- CreateTable
CREATE TABLE "_SeenBills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SeenBills_AB_unique" ON "_SeenBills"("A", "B");

-- CreateIndex
CREATE INDEX "_SeenBills_B_index" ON "_SeenBills"("B");

-- AddForeignKey
ALTER TABLE "_SeenBills" ADD CONSTRAINT "_SeenBills_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeenBills" ADD CONSTRAINT "_SeenBills_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
