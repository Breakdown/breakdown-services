import { Issue, User } from "@prisma/client";
import dbClient from "../utils/prisma.js";

export enum NotificationType {
  BILL_INTRODUCED,
  BILL_SUMMARIZED,
  UPCOMING_VOTE_ON_BILL,
  BILL_SUMMARY_UPDATED,
  BILL_VOTED_ON,
}

interface NotificationData {
  billId: string;
  billTitle?: string;
}

export interface NotificationJobData {
  userId: string;
  notificationType: NotificationType;
  data?: NotificationData;
}

class NotificationService {
  async sendNotification(
    userId: string,
    notificationType: NotificationType,
    data?: NotificationData
  ) {
    // Send notification to user
    console.log(`Sending notification to user ${userId}`);
    return;
  }

  async getUsersInterestedInNotification(
    notificationType: NotificationType,
    data: NotificationData
  ): Promise<User[]> {
    // Get users interested in bill for the type
    // Join on user issues and bill issues
    console.info(
      `Getting users interested in notification type ${notificationType}, data: ${JSON.stringify(
        data
      )}`
    );
    const billNotifTypes: NotificationType[] = [
      NotificationType.BILL_INTRODUCED,
      NotificationType.BILL_SUMMARIZED,
      NotificationType.UPCOMING_VOTE_ON_BILL,
      NotificationType.BILL_SUMMARY_UPDATED,
      NotificationType.BILL_VOTED_ON,
    ];
    if (billNotifTypes.includes(notificationType)) {
      const billWithIssues = await dbClient.bill.findUnique({
        where: {
          id: data?.billId,
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
                          id: data?.billId,
                        },
                      },
                    },
                    {
                      cosponsoredBills: {
                        some: {
                          id: data?.billId,
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
                          id: data?.billId,
                        },
                      },
                    },
                    {
                      cosponsoredBills: {
                        some: {
                          id: data?.billId,
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
                      id: billWithIssues.primaryIssue.id,
                    },
                    {
                      id: {
                        in: billWithIssues.issues.map(
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
                  id: data?.billId,
                },
              },
            },
          ],
        },
      });
      return users;
    }
    return [];
  }
}

export default NotificationService;
