import { Prisma, UserBillVote } from "@prisma/client";
import dbClient from "../utils/prisma.js";

class VotesService {
  constructor() {}

  async upsertVote(
    vote: Prisma.UserBillVoteCreateInput & {
      bill: { connect: { id: string } };
      user: { connect: { id: string } };
    }
  ): Promise<UserBillVote> {
    return dbClient.userBillVote.upsert({
      where: {
        unique_user_bill_vote: {
          userId: vote.user.connect?.id,
          billId: vote.bill?.connect?.id,
        },
      },
      create: vote,
      update: vote,
    });
  }

  async getVoteByBillIdAndUserId(
    billId: string,
    userId: string
  ): Promise<UserBillVote | null> {
    return dbClient.userBillVote.findUnique({
      where: {
        unique_user_bill_vote: {
          userId,
          billId,
        },
      },
    });
  }

  async getVotesForUser(userId: string): Promise<UserBillVote[]> {
    return dbClient.userBillVote.findMany({
      where: {
        userId,
      },
    });
  }
}

export default VotesService;
