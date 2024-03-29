interface ProPublicaResponse<T> {
  results: T[];
}

interface PropublicaMembersResult {
  members: PropublicaMember[];
}

interface PropublicaBillsResult {
  bills: ProPublicaBill[];
}

interface PropublicaCosponsorsResult {
  cosponsors: ProPublicaCosponsor[];
}

interface ProPublicaSingleBillResult {
  votes: PropublicaBillVote[];
}

interface PropublicaUpcomingBillsResult {
  bills: PropublicaUpcomingBill[];
}

export interface PropublicaSubject {
  url_name: string;
  name: string;
}
interface PropublicaSubjectsResult {
  subjects: PropublicaSubject[];
}

export interface PropublicaUpcomingBill {
  congress: string;
  chamber: string;
  bill_id: string;
  bill_slug: string;
  bill_type: string;
  bill_number: string;
  api_uri: string;
  legislative_day: string;
  scheduled_at: string;
  range: string;
  context?: string;
  description: string;
  bill_url: string;
  consideration: string;
  source_type: string;
  url: string;
}

interface CosponsorsByParty {
  D: number;
  R: number;
}

export interface PropublicaBillVote {
  chamber: string;
  date: string;
  time: string;
  roll_call: string;
  question: string;
  result: string;
  total_yes: number;
  total_no: number;
  total_not_voting: number;
  api_url: string;
}

export interface ProPublicaCosponsor {
  cosponsor_id: string;
  name: string;
  cosponsor_title: string;
  cosponsor_state: string;
  cosponsor_party: string;
  cosponsor_uri: string;
  date: string;
}
export interface ProPublicaBill {
  bill_id: string;
  bill_slug?: string;
  bill_type?: string;
  number?: string;
  bill_uri?: string;
  title?: string;
  short_title?: string;
  sponsor_title?: string;
  sponsor_id?: string;
  sponsor_name?: string;
  sponsor_state?: string;
  sponsor_party?: string;
  sponsor_uri?: string;
  gpo_pdf_uri?: string;
  congressdotgov_url?: string;
  govtrack_url?: string;
  introduced_date?: string;
  active?: boolean;
  last_vote?: string;
  house_passage?: string;
  senate_passage?: string;
  enacted?: string;
  vetoed?: string;
  cosponsors?: number;
  cosponsors_by_party?: CosponsorsByParty;
  committees?: string;
  committee_codes?: string[];
  subcommittee_codes?: string[];
  primary_subject?: string;
  summary?: string;
  summary_short?: string;
  latest_major_action_date?: string;
  latest_major_action?: string;
}

export interface PropublicaMember {
  id: string;
  title: string;
  short_title: string;
  api_uri: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  date_of_birth: string;
  gender: string;
  party: string;
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
}

interface ProPublicaVoteBill {
  bill_id?: string;
  number?: string;
  sponsor_id?: string;
  bill_uri?: string;
  title?: string;
  latest_action?: string;
}

export interface ProPublicaVote {
  member_id?: string;
  chamber?: string;
  congress?: string;
  session?: string;
  roll_call?: string;
  vote_uri?: string;
  bill?: ProPublicaVoteBill;
  question?: string;
  result?: string;
  date?: string;
  time?: string;
  position?: string;
}

export interface PropublicaBillsResponse
  extends ProPublicaResponse<PropublicaBillsResult> {}

export interface PropublicaMembersResponse
  extends ProPublicaResponse<PropublicaMembersResult> {}

export interface PropublicaSubjectsResponse
  extends ProPublicaResponse<PropublicaSubjectsResult> {}

export interface PropublicaCosponsorsResponse
  extends ProPublicaResponse<PropublicaCosponsorsResult> {}

export interface PropublicaBillByIdResponse
  extends ProPublicaResponse<ProPublicaSingleBillResult> {}

export interface PropublicaUpcomingBillsResponse
  extends ProPublicaResponse<PropublicaUpcomingBillsResult> {}

export interface ProPublicaPosition {
  member_id: string;
  name: string;
  party: string;
  state: string;
  district: string;
  cook_pvi?: number;
  vote_position: string;
  dw_nominate?: number;
}
export interface PropublicaRollCallVoteByIdResponse {
  results: {
    votes: {
      vote: {
        positions: ProPublicaPosition[];
      };
    };
  };
}
