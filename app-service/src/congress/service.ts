import { Axios } from "axios";

const CONGRESS_GOV_BASE_API_URL = "https://api.congress.gov/v3";

interface PaginationParams {
  limit?: number;
  offset?: number;
}

interface BaseMember {
  bioguideId: string;
  depiction: {
    attribution: string;
    imageUrl: string;
  };
  district: number;
  name: string;
  partyName: string;
  state: string;
  terms: {
    item: {
      chamber: string;
      startYear: number;
    }[];
  };
  updateDate: string;
  url: string;
}

interface MembersResponse {
  members: BaseMember[];
}

interface MemberDetails {
  addressInformation: {
    city: string;
    district: string;
    officeAddress: string;
    phoneNumber: string;
    zipCode: number;
  };
  birthYear: string;
  cosponsoredLegislation: {
    count: number;
    url: string;
  };
  currentMember: boolean;
  directOrderName: string;
  firstName: string;
  honorificName: string;
  invertedOrderName: string;
  lastName: string;
  middleName: string;
  officialWebsiteUrl: string;
  partyHistory: {
    partyAbbreviation: string;
    partyName: string;
    startYear: number;
  }[];
  sponsoredLegislation: {
    count: number;
    url: string;
  };
  state: string;
  terms: {
    chamber: string;
    congress: number;
    endYear?: number;
    memberType: string;
    startYear: number;
    stateCode: string;
    stateName: string;
  }[];
  updateDate: string;
  bioguideId: string;
  depiction: {
    attribution: string;
    imageUrl: string;
  };
  district: number;
  name: string;
  partyName: string;
  url: string;
}

interface MemberResponse {
  member: MemberDetails;
}

interface BaseBill {
  congress: number;
  latestAction: {
    actionDate: string;
    text: string;
  };
  number: string;
  originChamber: string;
  originChamberCode: string;
  title: string;
  type: string;
  updateDate: string;
  updateDateIncludingText: string;
  url: string;
}

interface BillsResponse {
  bills: BaseBill[];
}

interface BillDetails {
  actions: {
    count: number;
    url: string;
  };
  cboCostEstimates: {
    description: string;
    pubDate: string;
    title: string;
    url: string;
  }[];
  committees: {
    count: number;
    url: string;
  };
  congress: number;
  constitutionalAuthorityStatementText: string;
  cosponsors: {
    count: number;
    countIncludingWithdrawnCosponsors: number;
    url: string;
  };
  introducedDate: string;
  latestAction: {
    actionDate: string;
    text: string;
  };
  number: string;
  originChamber: string;
  originChamberCode: string;
  policyArea: {
    name: string;
  };
  sponsors: {
    bioguideId: string;
    district: number;
    firstName: string;
    fullName: string;
    isByRequest: string;
    lastName: string;
    party: string;
    state: string;
    url: string;
  }[];
  subjects: {
    count: number;
    url: string;
  };
  summaries: {
    count: number;
    url: string;
  };
  textVersions: {
    count: number;
    url: string;
  };
  title: string;
  titles: {
    count: number;
    url: string;
  };
  type: string;
  updateDate: string;
  updateDateIncludingText: string;
}

interface BillResponse {
  bill: BillDetails;
}

interface SubjectsResponse {
  pagination: {
    count: number;
  };
  request: {
    billNumber: string;
    billType: string;
    billUrl: string;
    congress: string;
    contentType: string;
    format: string;
  };
  subjects: {
    legislativeSubjects: {
      name: string;
    }[];
    policyArea: {
      name: string;
    };
  };
}

interface CosponsorsResponse {
  cosponsors: {
    bioguideId: string;
    district: number;
    firstName: string;
    fullName: string;
    isOriginalCosponsor: boolean;
    lastName: string;
    middleName: string;
    party: string;
    sponsorshipDate: string;
    state: string;
    url: string;
  }[];
  pagination: {
    count: number;
    countIncludingWithdrawnCosponsors: number;
  };
  request: {
    billNumber: string;
    billType: string;
    billUrl: string;
    congress: string;
    contentType: string;
    format: string;
  };
}

interface RelatedBillsResponse {
  relatedBills: {
    bill: BaseBill;
  }[];
}

interface LawsResponse {
  bills: BaseBill[];
}

interface ActionsResponse {
  actions: {
    actionCode: string;
    actionDate: string;
    committees: {
      name: string;
      systemCode: string;
      url: string;
    }[];
    sourceSystem: {
      code: number;
      name: string;
    };
    text: string;
    type: string;
  }[];
}

class CongressGovService {
  private axiosClient: Axios;
  constructor() {
    if (!process.env.CONGRESS_GOV_API_KEY) {
      throw new Error("process.env.CONGRESS_GOV_API_KEY not found");
    }
    this.axiosClient = new Axios({
      baseURL: CONGRESS_GOV_BASE_API_URL,
    });

    this.axiosClient.interceptors.request.use((config) => {
      // use config.params if it has been set
      config.params = config.params || {};
      // add any client instance specific params to config
      config.params["api_key"] = process.env.CONGRESS_GOV_API_KEY;
      return config;
    });
  }

  getMembers({
    limit = 20,
    offset = 0,
    updatedAfter,
  }: {
    updatedAfter?: Date;
  } & PaginationParams) {
    return this.axiosClient.get("/members", {
      params: {
        limit,
        offset,
        currentMember: true,
        ...(updatedAfter ? { fromDateTime: updatedAfter.toISOString() } : {}),
        format: "json",
      },
    });
  }
  // {
  // "members": [
  //   {
  //     "bioguideId": "V000135",
  //     "depiction": {
  //       "attribution": "Image courtesy of the Member",
  //       "imageUrl": "https://www.congress.gov/img/member/v000135_200.jpg"
  //     },
  //     "district": 3,
  //     "name": "Van Orden, Derrick",
  //     "partyName": "Republican",
  //     "state": "Wisconsin",
  //     "terms": {
  //       "item": [
  //         {
  //           "chamber": "House of Representatives",
  //           "startYear": 2023
  //         }
  //       ]
  //     },
  //     "updateDate": "2024-06-08T18:40:22Z",
  //     "url": "https://api.congress.gov/v3/member/V000135?format=json"
  //   },

  // Get detailed information about a member
  getMember({ memberBioguideId }: { memberBioguideId: string }) {
    return this.axiosClient.get(`/members/${memberBioguideId}`, {
      params: {
        format: "json",
      },
    });
  }
  //   {
  //     "member": {
  //         "addressInformation": {
  //             "city": "Washington",
  //             "district": "DC",
  //             "officeAddress": "2059 Rayburn House Office Building",
  //             "phoneNumber": "(202) 225-1790",
  //             "zipCode": 20510
  //         },
  //         "bioguideId": "P000610",
  //         "birthYear": "1966",
  //         "cosponsoredLegislation": {
  //             "count": 846,
  //             "url": "https://api.congress.gov/v3/member/P000610/cosponsored-legislation"
  //         },
  //         "currentMember": true,
  //         "depiction": {
  //             "attribution": "Congressional Pictorial Directory",
  //             "imageUrl": "https://www.congress.gov/img/member/116_dg_vi_plaskett_stacey_200.jpg"
  //         },
  //         "directOrderName": "Stacey E. Plaskett",
  //         "firstName": "Stacey",
  //         "honorificName": "Ms.",
  //         "invertedOrderName": "Plaskett, Stacey E.",
  //         "lastName": "Plaskett",
  //         "middleName": "E.",
  //         "officialWebsiteUrl": "https://plaskett.house.gov/",
  //         "partyHistory": [
  //             {
  //                 "partyAbbreviation": "D",
  //                 "partyName": "Democratic",
  //                 "startYear": 2015
  //             }
  //         ],
  //         "sponsoredLegislation": {
  //             "count": 114,
  //             "url": "https://api.congress.gov/v3/member/P000610/sponsored-legislation"
  //         },
  //         "state": "Virgin Islands",
  //         "terms": [
  //             {
  //                 "chamber": "House of Representatives",
  //                 "congress": 114,
  //                 "endYear": 2017,
  //                 "memberType": "Delegate",
  //                 "startYear": 2015,
  //                 "stateCode": "VI",
  //                 "stateName": "Virgin Islands"
  //             },
  //             {
  //                 "chamber": "House of Representatives",
  //                 "congress": 115,
  //                 "endYear": 2019,
  //                 "memberType": "Delegate",
  //                 "startYear": 2017,
  //                 "stateCode": "VI",
  //                 "stateName": "Virgin Islands"
  //             },
  //             {
  //                 "chamber": "House of Representatives",
  //                 "congress": 116,
  //                 "endYear": 2021,
  //                 "memberType": "Delegate",
  //                 "startYear": 2019,
  //                 "stateCode": "VI",
  //                 "stateName": "Virgin Islands"
  //             },
  //             {
  //                 "chamber": "House of Representatives",
  //                 "congress": 117,
  //                 "endYear": 2023,
  //                 "memberType": "Delegate",
  //                 "startYear": 2021,
  //                 "stateCode": "VI",
  //                 "stateName": "Virgin Islands"
  //             },
  //             {
  //                 "chamber": "House of Representatives",
  //                 "congress": 118,
  //                 "memberType": "Delegate",
  //                 "startYear": 2023,
  //                 "stateCode": "VI",
  //                 "stateName": "Virgin Islands"
  //             }
  //         ],
  //         "updateDate": "2024-06-08T18:40:22Z"
  //     },
  //     "request": {
  //         "bioguideId": "p000610",
  //         "contentType": "application/json",
  //         "format": "json"
  //     }
  // }

  // Get bills sorted by updated at date
  getBills({
    limit = 20,
    offset = 0,
    updatedAfter,
  }: { updatedAfter?: Date } & PaginationParams) {
    return this.axiosClient.get("/bill", {
      params: {
        limit,
        offset,
        ...(updatedAfter ? { fromDateTime: updatedAfter.toISOString() } : {}),
        format: "json",
      },
    });
  }
  // {
  // "bills": [
  //   {
  //     "congress": 118,
  //     "latestAction": {
  //       "actionDate": "2024-06-07",
  //       "text": "Reported by the Committee on Energy and Commerce. H. Rept. 118-546, Part I."
  //     },
  //     "number": "3299",
  //     "originChamber": "House",
  //     "originChamberCode": "H",
  //     "title": "Deploying Infrastructure with Greater Internet Transactions And Legacy Applications Act",
  //     "type": "HR",
  //     "updateDate": "2024-06-08",
  //     "updateDateIncludingText": "2024-06-08T08:05:40Z",
  //     "url": "https://api.congress.gov/v3/bill/118/hr/3299?format=json"
  //   },

  //  Get detailed information about a bill
  getBill({
    congress,
    billType,
    billNumber,
  }: {
    congress: number;
    billType: string;
    billNumber: number;
  }) {
    return this.axiosClient.get(`/bill/${congress}/${billType}/${billNumber}`, {
      params: {
        format: "json",
      },
    });
  }

  //   {
  //     "bill": {
  //         "actions": {
  //             "count": 14,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/actions?format=json"
  //         },
  //         "cboCostEstimates": [
  //             {
  //                 "description": "As ordered reported by the House Committee on Energy and Commerce on May 24, 2023\n",
  //                 "pubDate": "2023-08-25T15:30:00Z",
  //                 "title": "H.R. 3299, DIGITAL Applications Act",
  //                 "url": "https://www.cbo.gov/publication/59526"
  //             }
  //         ],
  //         "committees": {
  //             "count": 3,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/committees?format=json"
  //         },
  //         "congress": 118,
  //         "constitutionalAuthorityStatementText": "<pre>\n[Congressional Record Volume 169, Number 81 (Monday, May 15, 2023)]\n[House]\nFrom the Congressional Record Online through the Government Publishing Office [<a href=\"https://www.gpo.gov\">www.gpo.gov</a>]\nBy Mrs. CAMMACK:\nH.R. 3299.\nCongress has the power to enact this legislation pursuant\nto the following:\nArticle I, Section 8, Clause 3 of the Constitution\nThe single subject of this legislation is:\nTo expedite broadband deployment by streamlining permitting\nreviews.\n[Page H2348]\n</pre>",
  //         "cosponsors": {
  //             "count": 1,
  //             "countIncludingWithdrawnCosponsors": 1,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/cosponsors?format=json"
  //         },
  //         "introducedDate": "2023-05-15",
  //         "latestAction": {
  //             "actionDate": "2024-06-07",
  //             "text": "Reported by the Committee on Energy and Commerce. H. Rept. 118-546, Part I."
  //         },
  //         "number": "3299",
  //         "originChamber": "House",
  //         "originChamberCode": "H",
  //         "policyArea": {
  //             "name": "Science, Technology, Communications"
  //         },
  //         "sponsors": [
  //             {
  //                 "bioguideId": "C001039",
  //                 "district": 3,
  //                 "firstName": "Kat",
  //                 "fullName": "Rep. Cammack, Kat [R-FL-3]",
  //                 "isByRequest": "N",
  //                 "lastName": "Cammack",
  //                 "party": "R",
  //                 "state": "FL",
  //                 "url": "https://api.congress.gov/v3/member/C001039?format=json"
  //             }
  //         ],
  //         "subjects": {
  //             "count": 6,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/subjects?format=json"
  //         },
  //         "summaries": {
  //             "count": 1,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/summaries?format=json"
  //         },
  //         "textVersions": {
  //             "count": 1,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/text?format=json"
  //         },
  //         "title": "Deploying Infrastructure with Greater Internet Transactions And Legacy Applications Act",
  //         "titles": {
  //             "count": 4,
  //             "url": "https://api.congress.gov/v3/bill/118/hr/3299/titles?format=json"
  //         },
  //         "type": "HR",
  //         "updateDate": "2024-06-08T08:05:40Z",
  //         "updateDateIncludingText": "2024-06-08T08:05:40Z"
  //     },
  //     "request": {
  //         "billNumber": "3299",
  //         "billType": "hr",
  //         "congress": "118",
  //         "contentType": "application/json",
  //         "format": "json"
  //     }
  // }

  // Fetch subjects for bill
  getSubjectsForBill({
    congress,
    billType,
    billNumber,
  }: {
    congress: number;
    billType: string;
    billNumber: number;
  }) {
    return this.axiosClient.get(
      `/bill/${congress}/${billType}/${billNumber}/subjects`,
      {
        params: {
          format: "json",
        },
      }
    );
  }

  //   {
  //     "pagination": {
  //         "count": 6
  //     },
  //     "request": {
  //         "billNumber": "3299",
  //         "billType": "hr",
  //         "billUrl": "https://api.congress.gov/v3/bill/118/hr/3299?format=json",
  //         "congress": "118",
  //         "contentType": "application/json",
  //         "format": "json"
  //     },
  //     "subjects": {
  //         "legislativeSubjects": [
  //             {
  //                 "name": "Government buildings, facilities, and property"
  //             },
  //             {
  //                 "name": "Government information and archives"
  //             },
  //             {
  //                 "name": "Internet, web applications, social media"
  //             },
  //             {
  //                 "name": "Land use and conservation"
  //             },
  //             {
  //                 "name": "Telephone and wireless communication"
  //             }
  //         ],
  //         "policyArea": {
  //             "name": "Science, Technology, Communications"
  //         }
  //     }
  // }

  // Fetch cosponsors for a bill
  getCosponsorsForBill({
    congress,
    billType,
    billNumber,
  }: {
    congress: number;
    billType: string;
    billNumber: number;
  }) {
    return this.axiosClient.get(
      `/bill/${congress}/${billType}/${billNumber}/cosponsors`,
      {
        params: {
          format: "json",
        },
      }
    );
  }

  //   {
  //     "cosponsors": [
  //         {
  //             "bioguideId": "M001163",
  //             "district": 7,
  //             "firstName": "Doris",
  //             "fullName": "Rep. Matsui, Doris O. [D-CA-7]",
  //             "isOriginalCosponsor": true,
  //             "lastName": "Matsui",
  //             "middleName": "O.",
  //             "party": "D",
  //             "sponsorshipDate": "2023-05-15",
  //             "state": "CA",
  //             "url": "https://api.congress.gov/v3/member/M001163?format=json"
  //         }
  //     ],
  //     "pagination": {
  //         "count": 1,
  //         "countIncludingWithdrawnCosponsors": 1
  //     },
  //     "request": {
  //         "billNumber": "3299",
  //         "billType": "hr",
  //         "billUrl": "https://api.congress.gov/v3/bill/118/hr/3299?format=json",
  //         "congress": "118",
  //         "contentType": "application/json",
  //         "format": "json"
  //     }
  // }

  // Get related bills for a bill
  getRelatedBills({
    congress,
    billType,
    billNumber,
  }: {
    congress: number;
    billType: string;
    billNumber: number;
  }) {
    return this.axiosClient.get(
      `/bill/${congress}/${billType}/${billNumber}/relatedbills`,
      {
        params: {
          format: "json",
        },
      }
    );
  }

  // Get laws - passed bills
  getLaws({ congress }: { congress: number }) {
    return this.axiosClient.get(`/law/${congress}`, {
      params: {
        format: "json",
      },
    });
  }
  // {
  // "bills": [
  //       {
  //           "congress": 118,
  //           "latestAction": {
  //               "actionDate": "2024-05-24",
  //               "text": "Became Public Law No: 118-64."
  //           },
  //           "laws": [
  //               {
  //                   "number": "118-64",
  //                   "type": "Public Law"
  //               }
  //           ],
  //           "number": "546",
  //           "originChamber": "Senate",
  //           "originChamberCode": "S",
  //           "title": "Recruit and Retain Act",
  //           "type": "S",
  //           "updateDate": "2024-05-29",
  //           "updateDateIncludingText": "2024-05-29T16:27:26Z",
  //           "url": "https://api.congress.gov/v3/bill/118/s/546?format=json"
  //       },

  // Get actions for a bill
  getActionsForBill({
    congress,
    billType,
    billNumber,
  }: {
    congress: number;
    billType: string;
    billNumber: number;
  }) {
    return this.axiosClient.get(
      `/bill/${congress}/${billType}/${billNumber}/actions`,
      {
        params: {
          format: "json",
        },
      }
    );
  }
  // {
  // "actions": [
  //       {
  //           "actionCode": "H12200",
  //           "actionDate": "2024-06-07",
  //           "committees": [
  //               {
  //                   "name": "Energy and Commerce Committee",
  //                   "systemCode": "hsif00",
  //                   "url": "https://api.congress.gov/v3/committee/house/hsif00?format=json"
  //               }
  //           ],
  //           "sourceSystem": {
  //               "code": 2,
  //               "name": "House floor actions"
  //           },
  //           "text": "Reported by the Committee on Energy and Commerce. H. Rept. 118-546, Part I.",
  //           "type": "Committee"
  //       },
}

export default CongressGovService;
