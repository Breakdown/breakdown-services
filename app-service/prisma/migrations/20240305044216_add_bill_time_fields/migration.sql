-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "legislative_day" TEXT,
ADD COLUMN     "next_consideration" TEXT,
ADD COLUMN     "scheduled_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_at_range" TEXT;
