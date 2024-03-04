import { Redis } from "ioredis";
import { redis } from "../utils/redis.js";

enum CacheDataKeys {
  BILLS_FOR_USER,
  USERS_INTERESTED_IN_BILL,
  PROPUBLICA_FETCH_BILLS,
  PROPUBLICA_SUBJECTS_FOR_BILL,
  PROPUBLICA_FETCH_COSPONSORS_FOR_BILL,
  PROPUBLICA_FETCH_VOTES_FOR_BILL,
  PROPUBLICA_FETCH_MEMBERS,
  PROPUBLICA_FETCH_REP_VOTES_FOR_BILL,
}
class CacheService {
  redis: Redis;

  constructor() {
    this.redis = redis;
  }

  public get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  public async getJson<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get(key);
    return value ? (JSON.parse(value) as T) : undefined;
  }

  public async setData(key: CacheDataKeys) {}

  public async bustCache(
    key: CacheDataKeys,
    {
      userId,
      billId,
      propublicaUrl,
    }: {
      billId?: string;
      userId?: string;
      propublicaUrl?: string;
    } = {}
  ): Promise<void> {
    switch (key) {
      case CacheDataKeys.BILLS_FOR_USER:
        if (userId) {
          await this.delete(`${CacheDataKeys.BILLS_FOR_USER}:${userId}`);
        }
        break;
      case CacheDataKeys.USERS_INTERESTED_IN_BILL:
        if (billId) {
          await this.delete(
            `${CacheDataKeys.USERS_INTERESTED_IN_BILL}:${billId}`
          );
        }
        break;
      default:
        throw new Error("Invalid cache key");
    }
  }

  public set(
    key: string,
    value: any,
    expirationSeconds: number = 3600
  ): Promise<string> {
    return this.redis.set(key, value, "EX", expirationSeconds);
  }

  public delete(key: string): Promise<number> {
    return this.redis.del(key);
  }
}

export default CacheService;
