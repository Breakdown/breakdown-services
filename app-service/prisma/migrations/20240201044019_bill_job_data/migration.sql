-- CreateTable
CREATE TABLE "bill_job_data" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "last_full_text_sync" TIMESTAMP(3),
    "last_summary_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "bill_job_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bill_job_data_bill_id_key" ON "bill_job_data"("bill_id");

-- AddForeignKey
ALTER TABLE "bill_job_data" ADD CONSTRAINT "bill_job_data_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
