import { User } from "@prisma/client";
import dbClient from "../utils/prisma.js";

interface PatchMeParams {
  receivePromotions?: boolean;
  onboardedLocation?: boolean;
  onboardedIssues?: boolean;
  emailVerified?: boolean;
}
class UsersService {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }

  async getMe(): Promise<User | null> {
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: this.userId,
      },
    });
    return dbResponse;
  }

  async patchMe(data: PatchMeParams): Promise<User> {
    const dbResponse = await dbClient.user.update({
      where: {
        id: this.userId,
      },
      data,
    });
    return dbResponse;
  }
}

export default UsersService;
