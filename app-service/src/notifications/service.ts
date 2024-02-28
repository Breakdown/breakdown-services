import { Issue, User } from "@prisma/client";
import dbClient from "../utils/prisma.js";
import BillsService from "../bills/service.js";

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
    const billNotifTypes: NotificationType[] = [
      NotificationType.BILL_INTRODUCED,
      NotificationType.BILL_SUMMARIZED,
      NotificationType.UPCOMING_VOTE_ON_BILL,
      NotificationType.BILL_SUMMARY_UPDATED,
      NotificationType.BILL_VOTED_ON,
    ];
    if (billNotifTypes.includes(notificationType)) {
      const billsService = new BillsService();
      const users = billsService.getUsersInterestedInBill(data.billId);
      return users;
    }
    return [];
  }
}

export default NotificationService;
