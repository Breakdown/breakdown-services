import { Bill, Representative, RepresentativeVote } from "@prisma/client";
import dbClient from "../utils/prisma.js";

interface RepresentativeStats {
  votesWithPartyPercentage: number;
  votesAgaintsPartyPercentage: number;
  missedVotesPercentage: number;
  billsSponsored: number;
  billsCosponsored: number;
}
class RepresentativesService {
  constructor() {}

  async getRepById(id: string): Promise<Representative | null> {
    const dbResponse = await dbClient.representative.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }

  async getRepStatsById(id: string): Promise<RepresentativeStats | null> {
    const dbResponse = await dbClient.representative.findUnique({
      where: {
        id,
      },
      include: {
        sponsoredBills: true,
        cosponsoredBills: true,
      },
    });
    return {
      votesWithPartyPercentage: dbResponse?.votesWithPartyPct || 0,
      votesAgaintsPartyPercentage: dbResponse?.votesAgainstPartyPct || 0,
      missedVotesPercentage: dbResponse?.missedVotesPct || 0,
      billsSponsored: dbResponse?.sponsoredBills.length || 0,
      billsCosponsored: dbResponse?.cosponsoredBills.length || 0,
    };
  }

  async getRepVotesById(id: string): Promise<RepresentativeVote[] | null> {
    const dbResponse = await dbClient.representativeVote.findMany({
      where: {
        representativeId: id,
      },
    });
    return dbResponse;
  }

  async getSponsoredBillsById(id: string): Promise<Bill[] | null> {
    const dbResponse = await dbClient.bill.findMany({
      where: {
        sponsorId: id,
      },
    });
    return dbResponse;
  }

  async getCosponsoredBillsById(id: string): Promise<Bill[] | null> {
    const dbResponse = await dbClient.bill.findMany({
      where: {
        cosponsors: {
          some: {
            id,
          },
        },
      },
    });
    return dbResponse;
  }
}

export default RepresentativesService;
