import { Bill, Issue, Prisma } from "@prisma/client";
import dbClient from "../utils/prisma.js";

class IssuesService {
  async getIssues() {
    // Get issues from database
    const dbResponse = await dbClient.issue.findMany();
    return dbResponse;
  }

  async getIssueById(
    id: string
  ): Promise<(Issue & { billsWherePrimaryIssue: Bill[] }) | null | undefined> {
    const dbResponse = await dbClient.issue.findUnique({
      where: {
        id: id,
      },
      include: {
        billsWherePrimaryIssue: {
          take: 5,
        },
      },
    });
    return dbResponse;
  }

  async getFollowingIssuesFromUserId(
    userId: string
  ): Promise<Issue[] | null | undefined> {
    const dbResponse = await dbClient.issue.findMany({
      where: {
        followers: {
          some: {
            id: userId,
          },
        },
      },
    });
    return dbResponse;
  }

  async getBillsForIssueId(
    issueId: string
  ): Promise<Bill[] | null | undefined> {
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
    return dbResponse;
  }
}

export default IssuesService;
