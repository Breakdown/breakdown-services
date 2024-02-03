/*
  Warnings:

  - A unique constraint covering the columns `[bill_code]` on the table `bills` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_code_key" ON "bills"("bill_code");
