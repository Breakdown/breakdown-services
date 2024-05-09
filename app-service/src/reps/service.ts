import {
  Bill,
  Representative,
  RepresentativeVote,
  UserBillVote,
} from "@prisma/client";
import dbClient from "../utils/prisma.js";
import BadRequestError from "../utils/errors/BadRequestError.js";
import CacheService, { CacheDataKeys } from "../cache/service.js";

interface RepresentativeStats {
  votesWithPartyPercentage: number;
  votesAgaintsPartyPercentage: number;
  missedVotesPercentage: number;
  billsSponsored: number;
  billsCosponsored: number;
}

interface RepresentativeUserVoteMatch {
  repId: string;
  matchPercentage?: number;
}

enum RepBillVotePosition {
  NOT_VOTING = "Not Voting",
  NO = "No",
  PRESENT = "Present",
  SPEAKER = "Speaker",
  YES = "Yes",
}

class RepresentativesService {
  cacheService: CacheService;
  constructor() {
    this.cacheService = new CacheService();
  }

  async getRepById(id: string): Promise<Representative | null> {
    const dbResponse = await dbClient.representative.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }

  async getRepStatsById(id: string): Promise<RepresentativeStats | null> {
    const cachedResponse = await this.cacheService.getData<RepresentativeStats>(
      CacheDataKeys.REP_STATS_BY_ID,
      {
        representativeId: id,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.representative.findUnique({
      where: {
        id,
      },
      include: {
        sponsoredBills: true,
        cosponsoredBills: true,
      },
    });
    const repStats = {
      votesWithPartyPercentage: dbResponse?.votesWithPartyPct || 0,
      votesAgaintsPartyPercentage: dbResponse?.votesAgainstPartyPct || 0,
      missedVotesPercentage: dbResponse?.missedVotesPct || 0,
      billsSponsored: dbResponse?.sponsoredBills.length || 0,
      billsCosponsored: dbResponse?.cosponsoredBills.length || 0,
    };
    await this.cacheService.setData(CacheDataKeys.REP_STATS_BY_ID, repStats, {
      representativeId: id,
    });
    return repStats;
  }

  async getRepVotesById(id: string): Promise<RepresentativeVote[] | null> {
    const cachedResponse = await this.cacheService.getData<
      RepresentativeVote[]
    >(CacheDataKeys.REP_VOTES_BY_ID, {
      representativeId: id,
    });
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.representativeVote.findMany({
      where: {
        representativeId: id,
      },
    });
    await this.cacheService.setData(CacheDataKeys.REP_VOTES_BY_ID, dbResponse, {
      representativeId: id,
    });
    return dbResponse;
  }

  async getSponsoredBillsById(id: string): Promise<Bill[] | null> {
    const cachedResponse = await this.cacheService.getData<Bill[]>(
      CacheDataKeys.SPONSORED_BILLS_BY_REP_ID,
      {
        representativeId: id,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.bill.findMany({
      where: {
        sponsorId: id,
      },
    });
    await this.cacheService.setData(
      CacheDataKeys.SPONSORED_BILLS_BY_REP_ID,
      dbResponse,
      {
        representativeId: id,
      }
    );
    return dbResponse;
  }

  async getCosponsoredBillsById(id: string): Promise<Bill[] | null> {
    const cachedResponse = await this.cacheService.getData<Bill[]>(
      CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID,
      {
        representativeId: id,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.bill.findMany({
      where: {
        cosponsors: {
          some: {
            id,
          },
        },
      },
    });
    await this.cacheService.setData(
      CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID,
      dbResponse,
      {
        representativeId: id,
      }
    );
    return dbResponse;
  }

  async getMyRepsSponsoredBills(userId: string): Promise<Bill[] | null> {
    const cachedResponse = await this.cacheService.getData<Bill[]>(
      CacheDataKeys.BILLS_SPONSORED_BY_MY_REPS,
      {
        userId,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const representatives = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        myReps: true,
      },
    });
    const dbResponse = await dbClient.bill.findMany({
      where: {
        sponsor: {
          id: {
            in: representatives?.myReps.map((rep) => rep.id),
          },
        },
      },
    });
    await this.cacheService.setData(
      CacheDataKeys.BILLS_SPONSORED_BY_MY_REPS,
      dbResponse,
      {
        userId,
      }
    );
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
    await this.cacheService.bustCache(CacheDataKeys.USER_FOLLOWING_REPS, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.BILLS_FOR_USER, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.USERS_INTERESTED_IN_BILL, {
      userId,
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
    await this.cacheService.bustCache(CacheDataKeys.USER_FOLLOWING_REPS, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.BILLS_FOR_USER, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.USERS_INTERESTED_IN_BILL, {
      userId,
    });
  }

  async getFollowingReps(userId: string): Promise<Representative[] | null> {
    const cachedResponse = await this.cacheService.getData<Representative[]>(
      CacheDataKeys.USER_FOLLOWING_REPS,
      {
        userId,
      }
    );

    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        followingReps: true,
      },
    });
    const response = dbResponse?.followingReps || null;
    await this.cacheService.setData(
      CacheDataKeys.USER_FOLLOWING_REPS,
      response,
      {
        userId,
      }
    );
    return response;
  }

  async getRepsByDistrictAndState(
    district: string,
    state: string
  ): Promise<Representative[] | null> {
    const cachedResponse = await this.cacheService.getData<Representative[]>(
      CacheDataKeys.REPS_BY_STATE_AND_DISTRICT,
      {
        district,
        state,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
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
    await this.cacheService.setData(
      CacheDataKeys.REPS_BY_STATE_AND_DISTRICT,
      congressman.concat(senators),
      {
        district,
        state,
      }
    );
    return congressman.concat(senators);
  }

  async getLocalReps(userId: string): Promise<Representative[] | null> {
    const cachedResponse = await this.cacheService.getData<Representative[]>(
      CacheDataKeys.REPS_BY_STATE_AND_DISTRICT,
      {
        userId,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
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
    const reps = await this.getRepsByDistrictAndState(district, state);
    await this.cacheService.setData(
      CacheDataKeys.REPS_BY_STATE_AND_DISTRICT,
      reps,
      {
        userId,
      }
    );
    return reps;
  }

  async getRepVoteOnBill(
    repId: string,
    billId: string
  ): Promise<RepresentativeVote | null> {
    const cachedResponse = await this.cacheService.getData<RepresentativeVote>(
      CacheDataKeys.REP_VOTE_ON_BILL,
      {
        representativeId: repId,
        billId,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.representativeVote.findFirst({
      where: {
        representativeId: repId,
        billId,
      },
    });
    await this.cacheService.setData(
      CacheDataKeys.REP_VOTE_ON_BILL,
      dbResponse,
      {
        representativeId: repId,
        billId,
      }
    );
    return dbResponse;
  }

  convertRepVoteToUserEqualityBool(position: RepBillVotePosition): boolean {
    switch (position) {
      case "Not Voting":
        return false;
      case "No":
        return false;
      case "Present":
        return false;
      case "Speaker":
        return false;
      case "Yes":
        return true;
      default:
        return false;
    }
  }

  async getRepUserVoteMatch({
    repId,
    userId,
  }: {
    repId: string;
    userId: string;
  }): Promise<RepresentativeUserVoteMatch | null> {
    const cachedResponse =
      await this.cacheService.getData<RepresentativeUserVoteMatch>(
        CacheDataKeys.REP_USER_VOTE_MATCH,
        {
          representativeId: repId,
          userId,
        }
      );
    if (cachedResponse) {
      return cachedResponse;
    }

    let response: RepresentativeUserVoteMatch = {
      repId,
      matchPercentage: undefined,
    };

    // Create match count var
    let matchCount = 0;
    // Get all user bill votes
    const userVotes = await dbClient.userBillVote.findMany({
      where: {
        userId,
      },
    });
    if (!userVotes?.length) {
      return response;
    }
    // Store them in a map with their billId as key
    let userVotesMap: { [key: string]: UserBillVote } = {};
    userVotes.forEach((vote) => {
      userVotesMap[vote.billId] = vote;
    });
    // Get all rep bill votes
    const repVotes = await dbClient.representativeVote.findMany({
      where: {
        representativeId: repId,
      },
    });
    // Store them in a map with their billId as key
    let repVotesMap: { [key: string]: RepresentativeVote } = {};
    repVotes.forEach((vote) => {
      repVotesMap[vote.billId] = vote;
    });
    // Compare the two maps, looping over the user map
    for (const [billId, userVote] of Object.entries(userVotesMap)) {
      const repVote = repVotesMap[billId];
      // If the rep map has the same vote, increment match count
      if (repVote && userVote) {
        if (
          this.convertRepVoteToUserEqualityBool(
            repVote.position as RepBillVotePosition
          ) === userVote.position
        ) {
          matchCount++;
        }
      }
    }
    // Divide match count by total votes to get match percentage
    response.matchPercentage = matchCount / Object.keys(userVotesMap).length;

    await this.cacheService.setData(
      CacheDataKeys.REP_USER_VOTE_MATCH,
      response,
      {
        representativeId: repId,
        userId,
      }
    );
    return response;
  }

  async getFeaturedReps({
    limit = 10,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<Representative[] | null> {
    const cachedResponse = await this.cacheService.getData<Representative[]>(
      CacheDataKeys.FEATURED_REPS
    );
    if (cachedResponse) {
      return cachedResponse;
    }
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
      take: limit,
      skip: offset,
    });
    await this.cacheService.setData(CacheDataKeys.FEATURED_REPS, reps);
    return reps;
  }
}

export default RepresentativesService;
