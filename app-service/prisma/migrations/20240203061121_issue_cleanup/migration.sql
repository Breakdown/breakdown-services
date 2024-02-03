-- DropIndex
DROP INDEX "issues_id_name_slug_idx";

-- AlterTable
ALTER TABLE "issues" ALTER COLUMN "slug" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "issues_id_name_slug_subjects_idx" ON "issues"("id", "name", "slug", "subjects");
