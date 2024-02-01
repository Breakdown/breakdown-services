-- CreateTable
CREATE TABLE "bill_full_text" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "full_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "bill_full_text_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_full_text_bill_id_key" ON "bill_full_text"("bill_id");

-- AddForeignKey
ALTER TABLE "bill_full_text" ADD CONSTRAINT "bill_full_text_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
