import bcrypt from "bcryptjs";
import { Redis } from "ioredis";
import { redis } from "../utils/redis.js";
import InternalError from "../utils/errors/InternalError.js";

export enum CacheDataKeys {
  PROPUBLICA_FETCH_BILLS,
  PROPUBLICA_SUBJECTS_FOR_BILL,
  PROPUBLICA_FETCH_COSPONSORS_FOR_BILL,
  PROPUBLICA_FETCH_VOTES_FOR_BILL,
  PROPUBLICA_FETCH_MEMBERS,
  PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE,
  // User-related
  BILLS_FOR_USER,
  LOCAL_REPS,
  // Non-user-related
  BILL_SPONSOR,
  BILL_COSPONSORS,
  USERS_INTERESTED_IN_BILL,
  REP_STATS_BY_ID,
  REP_VOTES_BY_ID,
  SPONSORED_BILLS_BY_REP_ID,
  COSPONSORED_BILLS_BY_REP_ID,
  REPS_BY_STATE_AND_DISTRICT,
  REP_VOTE_ON_BILL,
  FEATURED_REPS,
}

interface CacheKeyData {
  billId?: string;
  userId?: string;
  propublicaUrl?: string;
  representativeId?: string;
  district?: string;
  state?: string;
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

  private async hashKey(key: string): Promise<string> {
    const hashedKey = await bcrypt.hash(key, 10);
    return hashedKey;
  }

  private async createCacheKeyFromKeyAndData(
    key: CacheDataKeys,
    {
      userId,
      billId,
      propublicaUrl,
      representativeId,
      district,
      state,
    }: CacheKeyData
  ): Promise<string> {
    switch (key) {
      // ProPublica-related
      case CacheDataKeys.PROPUBLICA_FETCH_BILLS:
        return this.hashKey(`propublica_fetch_bills:${propublicaUrl}`);
      case CacheDataKeys.PROPUBLICA_SUBJECTS_FOR_BILL:
        return this.hashKey(`propublica_subjects_for_bill:${propublicaUrl}`);
      case CacheDataKeys.PROPUBLICA_FETCH_COSPONSORS_FOR_BILL:
        return this.hashKey(
          `propublica_fetch_cosponsors_for_bill:${propublicaUrl}`
        );
      case CacheDataKeys.PROPUBLICA_FETCH_VOTES_FOR_BILL:
        return this.hashKey(`propublica_fetch_votes_for_bill:${propublicaUrl}`);
      case CacheDataKeys.PROPUBLICA_FETCH_MEMBERS:
        return this.hashKey(`propublica_fetch_members:${propublicaUrl}`);
      case CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE:
        return this.hashKey(
          `propublica_fetch_rep_votes_for_bill_vote:${propublicaUrl}`
        );
      // User-related
      case CacheDataKeys.BILLS_FOR_USER:
        return this.hashKey(`bills_for_user:${userId}`);
      case CacheDataKeys.LOCAL_REPS:
        return this.hashKey(`local_reps:${userId}`);
      // Non-user-related
      case CacheDataKeys.BILL_SPONSOR:
        return this.hashKey(`bill_sponsor:${billId}`);
      case CacheDataKeys.BILL_COSPONSORS:
        return this.hashKey(`bill_cosponsors:${billId}`);
      case CacheDataKeys.USERS_INTERESTED_IN_BILL:
        return this.hashKey(`users_interested_in_bill:${billId}`);
      case CacheDataKeys.REP_STATS_BY_ID:
        return this.hashKey(`rep_stats_by_id:${representativeId}`);
      case CacheDataKeys.REP_VOTES_BY_ID:
        return this.hashKey(`rep_votes_by_id:${representativeId}`);
      case CacheDataKeys.SPONSORED_BILLS_BY_REP_ID:
        return this.hashKey(`sponsored_bills_by_rep_id:${representativeId}`);
      case CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID:
        return this.hashKey(`cosponsored_bills_by_rep_id:${representativeId}`);
      case CacheDataKeys.REPS_BY_STATE_AND_DISTRICT:
        return this.hashKey(`reps_by_state_and_district:${state}:${district}`);
      case CacheDataKeys.REP_VOTE_ON_BILL:
        return this.hashKey(`rep_vote_on_bill:${representativeId}:${billId}`);
      case CacheDataKeys.FEATURED_REPS:
        return this.hashKey(`featured_reps`);
      default:
        throw new Error("Invalid cache key");
    }
  }

  private getExpirationTimeFromKey(key: CacheDataKeys): number {
    switch (key) {
      // ProPublica-related
      case CacheDataKeys.PROPUBLICA_FETCH_BILLS:
        return 3600;
      case CacheDataKeys.PROPUBLICA_SUBJECTS_FOR_BILL:
        return 3600;
      case CacheDataKeys.PROPUBLICA_FETCH_COSPONSORS_FOR_BILL:
        return 3600;
      case CacheDataKeys.PROPUBLICA_FETCH_VOTES_FOR_BILL:
        return 3600;
      case CacheDataKeys.PROPUBLICA_FETCH_MEMBERS:
        return 3600;
      case CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE:
        return 3600;
      // User-related
      case CacheDataKeys.BILLS_FOR_USER:
        return 60 * 60 * 24; // 1 day
      case CacheDataKeys.LOCAL_REPS:
        return 60 * 60 * 24 * 7; // 1 week
      // Non-user-related
      case CacheDataKeys.BILL_SPONSOR:
        return 3600;
      case CacheDataKeys.BILL_COSPONSORS:
        return 3600;
      case CacheDataKeys.USERS_INTERESTED_IN_BILL:
        return 3600;
      case CacheDataKeys.REP_STATS_BY_ID:
        return 3600;
      case CacheDataKeys.REP_VOTES_BY_ID:
        return 3600;
      case CacheDataKeys.SPONSORED_BILLS_BY_REP_ID:
        return 3600;
      case CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID:
        return 3600;
      case CacheDataKeys.REPS_BY_STATE_AND_DISTRICT:
        return 3600;
      case CacheDataKeys.REP_VOTE_ON_BILL:
        return 3600;
      case CacheDataKeys.FEATURED_REPS:
        return 3600;
      default:
        throw new InternalError("Invalid cache key");
    }
  }

  public async getData<T>(
    key: CacheDataKeys,
    keyData: CacheKeyData = {}
  ): Promise<T | undefined> {
    const cacheKey = await this.createCacheKeyFromKeyAndData(key, keyData);
    const value = await this.getJson<T>(cacheKey);
    return value;
  }

  public async setData(
    key: CacheDataKeys,
    data: any,
    keyData: CacheKeyData = {}
  ): Promise<boolean> {
    const cacheKey = await this.createCacheKeyFromKeyAndData(key, keyData);
    const expirationTime = this.getExpirationTimeFromKey(key);
    await this.set(cacheKey, JSON.stringify(data), expirationTime);
    return true;
  }

  public async bustCache(
    key: CacheDataKeys,
    data: CacheKeyData = {}
  ): Promise<boolean> {
    const cacheKey = await this.createCacheKeyFromKeyAndData(key, data);
    await this.delete(cacheKey);
    return true;
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
