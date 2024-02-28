import { Bill, Issue, Representative, User } from "@prisma/client";
import dbClient from "../utils/prisma.js";

class BillsService {
  constructor() {}

  async getBillById(id: string): Promise<Bill | null> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }

  async getBillSponsor(id: string): Promise<Representative | null | undefined> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
      select: {
        sponsor: true,
      },
    });
    return dbResponse?.sponsor;
  }

  async getBillCosponsors(id: string): Promise<Representative[] | undefined> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
      select: {
        cosponsors: true,
      },
    });
    return dbResponse?.cosponsors;
  }

  async billSeenByUser(billId: string, userId: string): Promise<void> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        seenBills: {
          connect: {
            id: billId,
          },
        },
      },
    });
    return;
  }

  async followBill(billId: string, userId: string): Promise<void> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        followingBills: {
          connect: {
            id: billId,
          },
        },
      },
    });
    return;
  }

  async unfollowBill(billId: string, userId: string): Promise<void> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        followingBills: {
          disconnect: {
            id: billId,
          },
        },
      },
    });
    return;
  }

  async getFollowingBills(userId: string): Promise<Bill[] | undefined> {
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        followingBills: true,
      },
    });
    return dbResponse?.followingBills;
  }

  async getUsersInterestedInBill(id: string): Promise<User[]> {
    // TODO: Caching
    const billWithIssues = await dbClient.bill.findUnique({
      where: {
        id,
      },
      include: {
        primaryIssue: true,
        issues: true,
      },
    });
    const users = dbClient.user.findMany({
      where: {
        OR: [
          // User's representatives (matching on state and district) have sponsored or cosponsored the bill
          {
            myReps: {
              some: {
                OR: [
                  {
                    sponsoredBills: {
                      some: {
                        id,
                      },
                    },
                  },
                  {
                    cosponsoredBills: {
                      some: {
                        id,
                      },
                    },
                  },
                ],
              },
            },
          },
          // User's following representatives have sponsored or cosponsored the bill
          {
            followingReps: {
              some: {
                OR: [
                  {
                    sponsoredBills: {
                      some: {
                        id,
                      },
                    },
                  },
                  {
                    cosponsoredBills: {
                      some: {
                        id,
                      },
                    },
                  },
                ],
              },
            },
          },
          // User's following issues match the bill's primary issue or any of its issues
          {
            followingIssues: {
              some: {
                OR: [
                  {
                    id: billWithIssues?.primaryIssue?.id,
                  },
                  {
                    id: {
                      in: billWithIssues?.issues.map(
                        (issue: Issue) => issue.id
                      ),
                    },
                  },
                ],
              },
            },
          },
          // User is following the bill
          {
            followingBills: {
              some: {
                id,
              },
            },
          },
        ],
      },
    });
    return users;
  }

  async getBillsForUser(userId: string): Promise<Bill[]> {
    // TODO: Caching
    const user = await dbClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        followingBills: true,
        followingIssues: true,
        followingReps: true,
        myReps: true,
      },
    });

    const issueIds = user?.followingIssues.map((issue: Issue) => issue.id);
    const repIds = (
      user?.followingReps?.map((rep: Representative) => rep.id) || []
    ).concat(user?.myReps?.map((rep: Representative) => rep.id) || []);

    const bills = await dbClient.bill.findMany({
      where: {
        OR: [
          // A bill issue is related to the user's following issues
          {
            issues: {
              some: {
                OR: [
                  {
                    id: {
                      in: issueIds,
                    },
                  },
                ],
              },
            },
          },
          // Bill's primary issue is included in the user's following issues
          {
            primaryIssue: {
              id: {
                in: issueIds,
              },
            },
          },
          // User's representatives sponsored a bill
          {
            sponsor: {
              id: {
                in: repIds,
              },
            },
          },
          // User's representatives cosponsored a bill
          {
            cosponsors: {
              some: {
                id: {
                  in: repIds,
                },
              },
            },
          },
        ],
      },
    });
    return bills;
  }
}

export default BillsService;
