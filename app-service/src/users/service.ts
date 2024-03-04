import { User } from "@prisma/client";
import dbClient from "../utils/prisma.js";
import CacheService, { CacheDataKeys } from "../cache/service.js";

interface PatchMeParams {
  receivePromotions?: boolean;
  onboardedLocation?: boolean;
  onboardedIssues?: boolean;
  emailVerified?: boolean;
}
class UsersService {
  userId: string;
  cacheService: CacheService;
  constructor(userId: string) {
    this.userId = userId;
    this.cacheService = new CacheService();
  }

  async getMe(): Promise<User | null> {
    const dbResponse = await dbClient.user.findUnique({
      where: {
        id: this.userId,
      },
      include: {
        locationData: true,
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

  async updateUserLocationAndReps({
    district,
    state,
    formattedAddress,
    latitude,
    longitude,
  }: {
    district: string;
    state: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<void> {
    // Update user's myReps
    const representatives = await dbClient.representative.findMany({
      where: {
        OR: [
          {
            // Congressmen and Delegates
            district,
            state,
            OR: [
              {
                shortTitle: "Rep.",
              },
              {
                shortTitle: "Del.",
              },
            ],
          },
          {
            // Senators
            state,
            shortTitle: "Sen.",
          },
        ],
      },
    });

    await dbClient.user.update({
      where: {
        id: this.userId,
      },
      data: {
        myReps: {
          set: representatives,
        },
        locationData: {
          upsert: {
            create: {
              district,
              state,
              address: formattedAddress,
              latitude,
              longitude,
            },
            update: {
              district,
              state,
              address: formattedAddress,
              latitude,
              longitude,
            },
          },
        },
      },
    });

    await this.cacheService.bustCache(CacheDataKeys.LOCAL_REPS, {
      userId: this.userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.BILLS_FOR_USER, {
      userId: this.userId,
    });
    await this.cacheService.bustCache(CacheDataKeys.USERS_INTERESTED_IN_BILL, {
      userId: this.userId,
    });
    return;
  }
}

export default UsersService;
