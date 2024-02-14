-- CreateTable
CREATE TABLE "user_bill_votes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "position" BOOLEAN NOT NULL,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_bill_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_bill_votes_user_id_bill_id_idx" ON "user_bill_votes"("user_id", "bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_bill_votes_user_id_bill_id_key" ON "user_bill_votes"("user_id", "bill_id");

-- AddForeignKey
ALTER TABLE "user_bill_votes" ADD CONSTRAINT "user_bill_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bill_votes" ADD CONSTRAINT "user_bill_votes_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
