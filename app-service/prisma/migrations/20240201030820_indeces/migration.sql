-- CreateIndex
CREATE INDEX "bills_primary_issue_id_sponsor_id_id_house_passage_senate_p_idx" ON "bills"("primary_issue_id", "sponsor_id", "id", "house_passage", "senate_passage", "importance");

-- CreateIndex
CREATE INDEX "issues_id_name_slug_idx" ON "issues"("id", "name", "slug");

-- CreateIndex
CREATE INDEX "representative_votes_representative_id_bill_id_idx" ON "representative_votes"("representative_id", "bill_id");

-- CreateIndex
CREATE INDEX "representatives_id_propublica_id_state_district_house_idx" ON "representatives"("id", "propublica_id", "state", "district", "house");
