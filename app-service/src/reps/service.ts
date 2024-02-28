import { Bill, Representative, RepresentativeVote } from "@prisma/client";
import dbClient from "../utils/prisma.js";
import BadRequestError from "../utils/errors/BadRequestError.js";

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

  async followRep(repId: string, userId: string): Promise<void> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        followingReps: {
          connect: {
            id: repId,
          },
        },
      },
    });
  }

  async unfollowRep(repId: string, userId: string): Promise<void> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        followingReps: {
          disconnect: {
            id: repId,
          },
        },
      },
    });
  }

  async getFollowingReps(userId: string): Promise<Representative[] | null> {
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        followingReps: true,
      },
    });
    return dbResponse?.followingReps || null;
  }

  async getRepsByDistrictAndState(
    district: string,
    state: string
  ): Promise<Representative[] | null> {
    // Congressmen
    const congressman = await dbClient.representative.findMany({
      where: {
        district,
        state,
      },
    });
    // Senators
    const senators = await dbClient.representative.findMany({
      where: {
        state,
        house: "senate",
      },
    });
    return congressman.concat(senators);
  }

  async getLocalReps(userId: string): Promise<Representative[] | null> {
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        locationData: true,
      },
    });
    const state = dbResponse?.locationData?.state;
    const district = dbResponse?.locationData?.district;
    if (!state || !district) {
      throw new BadRequestError("User does not have location data");
    }
    return await this.getRepsByDistrictAndState(district, state);
  }

  async getRepVoteOnBill(
    repId: string,
    billId: string
  ): Promise<RepresentativeVote | null> {
    const dbResponse = await dbClient.representativeVote.findFirst({
      where: {
        representativeId: repId,
        billId,
      },
    });
    return dbResponse;
  }

  async getFeaturedReps(): Promise<Representative[] | null> {
    // TODO: Caching
    const reps = await dbClient.representative.findMany({
      where: {
        OR: [
          // Sponsored a bill in the past month
          {
            sponsoredBills: {
              some: {
                introducedDate: {
                  gte: new Date(new Date().getTime() - 2.628e9),
                },
              },
            },
          },
          // Cosponsored a bill in the past month
          {
            cosponsoredBills: {
              some: {
                introducedDate: {
                  gte: new Date(new Date().getTime() - 2.628e9),
                },
              },
            },
          },
          // Has a bill sponsored with an upcoming vote in the next week
          {
            sponsoredBills: {
              some: {
                votes: {
                  some: {
                    dateTime: {
                      gte: new Date(),
                      lte: new Date(new Date().getTime() + 6.048e8),
                    },
                  },
                },
              },
            },
          },
          // Has a bill cosponsored with an upcoming vote in the next week
          {
            cosponsoredBills: {
              some: {
                votes: {
                  some: {
                    dateTime: {
                      gte: new Date(),
                      lte: new Date(new Date().getTime() + 6.048e8),
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });
    return reps;
  }
}

export default RepresentativesService;
