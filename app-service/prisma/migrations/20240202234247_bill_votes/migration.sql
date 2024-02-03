-- CreateTable
CREATE TABLE "bill_votes" (
    "id" TEXT NOT NULL,
    "chamber" TEXT NOT NULL,
    "date_time" TIMESTAMP(3) NOT NULL,
    "question" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "total_yes" INTEGER NOT NULL,
    "total_no" INTEGER NOT NULL,
    "total_not_voting" INTEGER NOT NULL,
    "api_url" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "bill_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bill_votes_chamber_bill_id_idx" ON "bill_votes"("chamber", "bill_id");

-- AddForeignKey
ALTER TABLE "bill_votes" ADD CONSTRAINT "bill_votes_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
