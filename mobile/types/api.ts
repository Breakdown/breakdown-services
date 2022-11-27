export interface BreakdownBill {
  id: string;
  primary_issue_id?: string;
  sponsor_id?: string;
  propublica_id: string;
  bill_code?: string;
  bill_uri?: string;
  bill_type?: string;
  title?: string;
  short_title?: string;
  sponsor_propublica_id?: string;
  sponsor_state?: string;
  sponsor_party?: string;
  gpo_pdf_uri?: string;
  congressdotgov_url?: string;
  govtrack_url?: string;
  introduced_date?: string;
  last_vote?: string;
  house_passage?: string;
  senate_passage?: string;
  enacted?: string;
  vetoed?: string;
  primary_subject?: string;
  summary?: string;
  summary_short?: string;
  latest_major_action_date?: string;
  latest_major_action?: string;
  legislative_day?: string;
  active?: boolean;
  committees?: string[];
  committee_codes?: string[];
  subcommittee_codes?: string[];
  cosponsors_d?: number;
  cosponsors_r?: number;
  subjects?: string[];
  edited?: boolean;
  human_summary?: string;
  human_short_summary?: string;
  human_title?: string;
  human_short_title?: string;
  importance?: number;
  created_at: string;
  updated_at?: string;
}

export interface BreakdownRep {
  id: string;
  title?: string;
  short_title?: string;
  api_uri?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  date_of_birth?: string;
  gender?: string;
  party?: string;
  leadership_role?: string;
  twitter_account?: string;
  facebook_account?: string;
  youtube_account?: string;
  govtrack_id?: string;
  cspan_id?: string;
  votesmart_id?: string;
  icpsr_id?: string;
  crp_id?: string;
  google_entity_id?: string;
  fec_candidate_id?: string;
  url?: string;
  rss_url?: string;
  contact_form?: string;
  in_office?: boolean;
  cook_pvi?: string;
  dw_nominate?: number;
  seniority?: string;
  next_election?: string;
  total_votes?: number;
  missed_votes?: number;
  total_present?: number;
  last_updated?: string;
  ocd_id?: string;
  office?: string;
  phone?: string;
  fax?: string;
  state?: string;
  district?: string;
  senate_class?: string;
  state_rank?: string;
  lis_id?: string;
  missed_votes_pct?: number;
  votes_with_party_pct?: number;
  votes_against_party_pct?: number;
  propublica_id: string;
  house: string;
  state_id?: string;
  district_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface BreakdownIssue {
  id: string;
  name?: string;
  slug: string;
  subjects?: string[];
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  onboarded: boolean;
  address?: string;
  state_id?: string;
  district_id?: string;
  phone?: string;
  phone_verification_code?: number;
  phone_verified: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RepresentativeVote {
  rep_propublica_id?: string;
  chamber?: string;
  congress?: string;
  congressional_session?: string;
  roll_call: string;
  vote_uri?: string;
  bill_propublica_id: string;
  question?: string;
  result?: string;
  position?: boolean;
  voted_at?: string;
  bill_id: string;
  representative_id: string;
}
