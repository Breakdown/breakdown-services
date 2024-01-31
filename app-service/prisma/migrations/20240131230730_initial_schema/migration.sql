-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "receive_promotions" BOOLEAN NOT NULL,
    "onboarded_location" BOOLEAN NOT NULL DEFAULT false,
    "onboarded_issues" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_location_data" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "state" TEXT,
    "district" TEXT,

    CONSTRAINT "user_location_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "primary_issue_id" TEXT,
    "sponsor_id" TEXT,
    "propublica_id" TEXT NOT NULL,
    "bill_code" TEXT NOT NULL,
    "bill_uri" TEXT NOT NULL,
    "bill_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "short_title" TEXT,
    "sponsor_propublica_id" TEXT,
    "sponsor_state" TEXT,
    "sponsor_party" TEXT,
    "gpo_pdf_uri" TEXT,
    "congressdotgov_url" TEXT,
    "govtrack_url" TEXT,
    "introduced_date" TEXT,
    "last_vote" TEXT,
    "house_passage" TEXT,
    "senate_passage" TEXT,
    "enacted" TEXT,
    "vetoed" TEXT,
    "primary_subject" TEXT,
    "summary" TEXT,
    "summary_short" TEXT,
    "latest_major_action_date" TEXT,
    "latest_major_action" TEXT,
    "legislative_date" TEXT,
    "active" BOOLEAN,
    "committees" TEXT[],
    "committee_codes" TEXT[],
    "subcommittee_codes" TEXT[],
    "cosponsors_d" INTEGER,
    "cosponsors_r" INTEGER,
    "subjects" TEXT[],
    "edited" BOOLEAN,
    "ai_summary" TEXT,
    "human_summary" TEXT,
    "ai_short_summary" TEXT,
    "human_short_summary" TEXT,
    "ai_title" TEXT,
    "human_title" TEXT,
    "ai_short_title" TEXT,
    "human_short_title" TEXT,
    "importance" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "subjects" TEXT[],
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representatives" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "short_title" TEXT,
    "api_uri" TEXT,
    "first_name" TEXT,
    "middle_name" TEXT,
    "last_name" TEXT,
    "suffix" TEXT,
    "date_of_birth" TEXT,
    "gender" TEXT,
    "party" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "govtrack_id" TEXT,
    "cspan_id" TEXT,
    "votesmart_id" TEXT,
    "icpsr_id" TEXT,
    "crp_id" TEXT,
    "google_entity_id" TEXT,
    "fec_candidate_id" TEXT,
    "url" TEXT,
    "rss_url" TEXT,
    "contact_form" TEXT,
    "in_office" BOOLEAN,
    "cook_pvi" TEXT,
    "dw_nominate" DOUBLE PRECISION,
    "seniority" TEXT,
    "next_election" TEXT,
    "total_votes" INTEGER,
    "missed_votes" INTEGER,
    "total_present" INTEGER,
    "last_updated" TEXT,
    "ocd_id" TEXT,
    "office" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "state" TEXT,
    "district" TEXT,
    "senate_class" TEXT,
    "state_rank" TEXT,
    "lis_id" TEXT,
    "missed_votes_pct" DOUBLE PRECISION,
    "votes_with_party_pct" DOUBLE PRECISION,
    "votes_against_party_pct" DOUBLE PRECISION,
    "propublica_id" TEXT NOT NULL,
    "house" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Cosponsor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_id_email_phone_idx" ON "users"("id", "email", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_location_data_user_id_key" ON "user_location_data"("user_id");

-- CreateIndex
CREATE INDEX "user_location_data_user_id_state_district_idx" ON "user_location_data"("user_id", "state", "district");

-- CreateIndex
CREATE UNIQUE INDEX "issues_name_key" ON "issues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "issues_slug_key" ON "issues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_Cosponsor_AB_unique" ON "_Cosponsor"("A", "B");

-- CreateIndex
CREATE INDEX "_Cosponsor_B_index" ON "_Cosponsor"("B");

-- AddForeignKey
ALTER TABLE "user_location_data" ADD CONSTRAINT "user_location_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_primary_issue_id_fkey" FOREIGN KEY ("primary_issue_id") REFERENCES "issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "representatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Cosponsor" ADD CONSTRAINT "_Cosponsor_A_fkey" FOREIGN KEY ("A") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Cosponsor" ADD CONSTRAINT "_Cosponsor_B_fkey" FOREIGN KEY ("B") REFERENCES "representatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
