-- CreateTable
CREATE TABLE "representative_votes" (
    "id" TEXT NOT NULL,
    "representative_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "vote" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "representative_votes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "representative_votes" ADD CONSTRAINT "representative_votes_representative_id_fkey" FOREIGN KEY ("representative_id") REFERENCES "representatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "representative_votes" ADD CONSTRAINT "representative_votes_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
