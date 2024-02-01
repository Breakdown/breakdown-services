/*
  Warnings:

  - A unique constraint covering the columns `[propublica_id]` on the table `bills` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bills_propublica_id_key" ON "bills"("propublica_id");
