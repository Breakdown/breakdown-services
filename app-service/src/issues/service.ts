import { Bill, Issue, Prisma } from "@prisma/client";
import dbClient from "../utils/prisma.js";
import CacheService, { CacheDataKeys } from "../cache/service.js";

class IssuesService {
  cacheService: CacheService;
  constructor() {
    this.cacheService = new CacheService();
  }
  async getIssues() {
    const cachedResponse = await this.cacheService.getData<Issue[]>(
      CacheDataKeys.ALL_ISSUES
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    // Get issues from database
    const dbResponse = await dbClient.issue.findMany();
    await this.cacheService.setData(CacheDataKeys.ALL_ISSUES, dbResponse);
    return dbResponse;
  }

  async getIssueById(
    id: string
  ): Promise<
    | (Issue & { billsWherePrimaryIssue: Bill[]; bills: Bill[] })
    | null
    | undefined
  > {
    const dbResponse = await dbClient.issue.findUnique({
      where: {
        id: id,
      },
      include: {
        billsWherePrimaryIssue: {
          take: 5,
        },
        bills: {
          take: 5,
        },
      },
    });
    return dbResponse;
  }

  async getFollowingIssuesFromUserId(
    userId: string
  ): Promise<Issue[] | null | undefined> {
    const cachedResponse = await this.cacheService.getData<Issue[]>(
      CacheDataKeys.USER_FOLLOWING_ISSUES,
      {
        userId,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.issue.findMany({
      where: {
        followers: {
          some: {
            id: userId,
          },
        },
      },
    });
    await this.cacheService.setData(
      CacheDataKeys.USER_FOLLOWING_ISSUES,
      dbResponse,
      {
        userId,
      }
    );
    return dbResponse;
  }

  async getBillsForIssueId(
    issueId: string
  ): Promise<Bill[] | null | undefined> {
    const cachedResponse = await this.cacheService.getData<Bill[]>(
      CacheDataKeys.BILLS_FOR_ISSUE,
      {
        issueId,
      }
    );
    if (cachedResponse) {
      return cachedResponse;
    }
    const dbResponse = await dbClient.bill.findMany({
      where: {
        OR: [
          { primaryIssueId: issueId },
          {
            issues: {
              some: {
                id: issueId,
              },
            },
          },
        ],
      },
    });
    await this.cacheService.setData(CacheDataKeys.BILLS_FOR_ISSUE, dbResponse, {
      issueId,
    });
    return dbResponse;
  }

  async followIssue(issueId: string, userId: string): Promise<Issue[]> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        onboardedIssues: true,
        followingIssues: {
          connect: {
            id: issueId,
          },
        },
      },
    });
    await this.cacheService.bustCache(CacheDataKeys.USER_FOLLOWING_ISSUES, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.USERS_INTERESTED_IN_BILL, {
      userId,
    });
    const userIssues = await this.getFollowingIssuesFromUserId(userId);
    return userIssues || [];
  }

  async unfollowIssue(issueId: string, userId: string): Promise<Issue[]> {
    await dbClient.user.update({
      where: {
        id: userId,
      },
      data: {
        followingIssues: {
          disconnect: {
            id: issueId,
          },
        },
      },
    });
    await this.cacheService.bustCache(CacheDataKeys.USER_FOLLOWING_ISSUES, {
      userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.USERS_INTERESTED_IN_BILL, {
      userId,
    });
    const userIssues = await this.getFollowingIssuesFromUserId(userId);
    return userIssues || [];
  }
}

export default IssuesService;
