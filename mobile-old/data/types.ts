export interface Bill {
  id: string;
  primaryIssueId?: string;
  sponsorId?: string;
  propublicaId: string;
  billCode: string;
  billUri: string;
  billType: string;
  title: string;
  shortTitle?: string;
  sponsorPropublicaId?: string;
  sponsorState?: string;
  sponsorParty?: string;
  gpoPdfUri?: string;
  congressdotgovUrl?: string;
  govtrackUrl?: string;
  introducedDate?: string;
  lastVote?: string;
  housePassage?: string;
  senatePassage?: string;
  enacted?: string;
  vetoed?: string;
  primarySubject?: string;
  summary?: string;
  summaryShort?: string;
  latestMajorActionDate?: string;
  latestMajorAction?: string;
  active?: boolean;
  committees: string[];
  committeeCodes: string[];
  subcommitteCodes: string[];
  cosponsorsD?: number;
  cosponsorsR?: number;
  subjects: string[];
  edited?: boolean;
  aiSummary?: string;
  humanSummary?: string;
  aiShortSummary?: string;
  humanShortSummary?: string;
  aiTitle?: string;
  humanTitle?: string;
  aiShortTitle?: string;
  humanShortTitle?: string;
  importance?: number;
  createdAt: string;
  updatedAt?: string;

  // Relations

  primaryIssue?: Issue;
  sponsor?: Representative;
  issues?: Issue[];
  cosponsors?: Representative[];
  representativeVotes?: RepresentativeVote[];
  fullText?: BillFullText;
  votes?: BillVote[];
  userBillVotes?: UserBillVote[];
}

export interface Issue {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  subjects: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;

  // Relations

  billsWherePrimaryIssue?: Bill[];
  bills?: Bill[];
}

export interface Representative {
  id: string;
  title?: string;
  shortTitle?: string;
  apiUri?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  dateOfBirth?: string;
  gender?: string;
  party?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  govtrackId?: string;
  cspanId?: string;
  votesmartId?: string;
  icpsrId?: string;
  crpId?: string;
  googleEntityId?: string;
  fecCandidateId?: string;
  url?: string;
  rssUrl?: string;
  contactForm?: string;
  inOffice?: boolean;
  cookPvi?: string;
  dwNominate?: number;
  seniority?: string;
  nextElection?: string;
  totalVotes?: number;
  missedVotes?: number;
  totalPresent?: number;
  lastUpdated?: string;
  ocdId?: string;
  office?: string;
  phone?: string;
  fax?: string;
  state?: string;
  district?: string;
  senateClass?: string;
  stateRank?: string;
  lisId?: string;
  missedVotesPct?: number;
  votesWithPartyPct?: number;
  votesAgainstPartyPct?: number;
  propublicaId: string;
  house: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;

  // Relations

  sponsoredBills?: Bill[];
  cosponsoredBills?: Bill[];
  votes?: RepresentativeVote[];
}

export interface RepresentativeVote {
  id: string;
  representativeId: string;
  billId: string;
  billVoteId: string;
  position: string;
  date?: string;
  createdAt: string;
  updatedAt?: string;

  // Relations

  representative?: Representative;
  billVote?: BillVote;
  bill?: Bill;
}

export interface BillFullText {
  id: string;
  billId: string;
  fullText: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillVote {
  id: string;
  chamber: string;
  dateTime: string;
  question: string;
  result: string;
  totalYes: number;
  totalNo: number;
  totalNotVoting: number;
  apiUrl: string;
  billId: string;
  createdAt: string;
  updatedAt?: string;

  // Relations

  repVotes?: RepresentativeVote[];
}

export interface RepresentativeStats {
  votesWithPartyPercentage: number;
  votesAgaintsPartyPercentage: number;
  missedVotesPercentage: number;
  billsSponsored: number;
  billsCosponsored: number;
}

export interface UserLocationData {
  id: string;
  userId: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  state?: string;
  district?: string;
}
export interface User {
  id: string;
  email?: string;
  phone?: string;
  password?: string;
  receivePromotions: boolean;
  onboardedLocation: boolean;
  onboardedIssues: boolean;
  createdAt: string;
  updatedAt?: string;
  emailVerified: boolean;

  // Relations

  locationData?: UserLocationData;
  followingBills?: Bill[];
  followingReps?: Representative[];
  followingIssues?: Issue[];
  myReps?: Representative[];
  myBillVotes?: UserBillVote[];
}

export interface UserBillVote {
  id: string;
  userId: string;
  billId: string;
  position: boolean;
  createdAt: string;
  updatedAt?: string;

  // Relations

  user?: User;
  bill?: Bill;
}

export interface AccessTokenResponse {
  accessToken: string;
}
