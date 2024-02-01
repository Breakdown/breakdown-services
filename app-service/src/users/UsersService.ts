import { User } from "@prisma/client";
import dbClient from "../utils/prisma.js";

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
}

export default UsersService;
