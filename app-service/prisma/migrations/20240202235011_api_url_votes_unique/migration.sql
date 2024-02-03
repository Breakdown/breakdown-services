/*
  Warnings:

  - A unique constraint covering the columns `[api_url]` on the table `bill_votes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bill_votes_api_url_key" ON "bill_votes"("api_url");
