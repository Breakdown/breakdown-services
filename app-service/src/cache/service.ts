import { Redis } from "ioredis";
import { redis } from "../utils/redis.js";
import InternalError from "../utils/errors/InternalError.js";

enum CacheDataKeys {
  PROPUBLICA_FETCH_BILLS,
  PROPUBLICA_SUBJECTS_FOR_BILL,
  PROPUBLICA_FETCH_COSPONSORS_FOR_BILL,
  PROPUBLICA_FETCH_VOTES_FOR_BILL,
  PROPUBLICA_FETCH_MEMBERS,
  PROPUBLICA_FETCH_REP_VOTES_FOR_BILL,
  // User-related
  BILLS_FOR_USER,
  USERS_INTERESTED_IN_BILL,
  LOCAL_REPS,
  // Non-user-related
  REP_STATS_BY_ID,
  REP_VOTES_BY_ID,
  SPONSORED_BILLS_BY_REP_ID,
  COSPONSORED_BILLS_BY_REP_ID,
  REPS_BY_DISTRICT_AND_STATE,
  REP_VOTE_ON_BILL,
  FEATURED_REPS,
}

interface CacheKeyData {
  billId?: string;
  userId?: string;
  propublicaUrl?: string;
  representativeId?: string;
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

  private createCacheKeyFromData(
    key: CacheDataKeys,
    { userId, billId, propublicaUrl, representativeId }: CacheKeyData
  ): string {
    switch (key) {
      // ProPublica-related
      case CacheDataKeys.PROPUBLICA_FETCH_BILLS:
        return `propublica_fetch_bills:${propublicaUrl}`;
      case CacheDataKeys.PROPUBLICA_SUBJECTS_FOR_BILL:
        return `propublica_subjects_for_bill:${propublicaUrl}`;
      case CacheDataKeys.PROPUBLICA_FETCH_COSPONSORS_FOR_BILL:
        return `propublica_fetch_cosponsors_for_bill:${propublicaUrl}`;
      case CacheDataKeys.PROPUBLICA_FETCH_VOTES_FOR_BILL:
        return `propublica_fetch_votes_for_bill:${propublicaUrl}`;
      case CacheDataKeys.PROPUBLICA_FETCH_MEMBERS:
        return `propublica_fetch_members:${propublicaUrl}`;
      case CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL:
        return `propublica_fetch_rep_votes_for_bill:${propublicaUrl}`;
      // User-related
      case CacheDataKeys.BILLS_FOR_USER:
        return `bills_for_user:${userId}`;
      case CacheDataKeys.USERS_INTERESTED_IN_BILL:
        return `users_interested_in_bill:${billId}`;
      case CacheDataKeys.LOCAL_REPS:
        return `local_reps:${userId}`;
      // Non-user-related
      case CacheDataKeys.REP_STATS_BY_ID:
        return `rep_stats_by_id:${representativeId}`;
      case CacheDataKeys.REP_VOTES_BY_ID:
        return `rep_votes_by_id:${representativeId}`;
      case CacheDataKeys.SPONSORED_BILLS_BY_REP_ID:
        return `sponsored_bills_by_rep_id:${userId}`;
      case CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID:
        return `cosponsored_bills_by_rep_id:${userId}`;
      case CacheDataKeys.REPS_BY_DISTRICT_AND_STATE:
        return `reps_by_district_and_state`;
      case CacheDataKeys.REP_VOTE_ON_BILL:
        return `rep_vote_on_bill:${billId}`;
      case CacheDataKeys.FEATURED_REPS:
        return `featured_reps`;
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
      case CacheDataKeys.PROPUBLICA_FETCH_REP_VOTES_FOR_BILL:
        return 3600;
      // User-related
      case CacheDataKeys.BILLS_FOR_USER:
        return 3600;
      case CacheDataKeys.USERS_INTERESTED_IN_BILL:
        return 3600;
      case CacheDataKeys.LOCAL_REPS:
        return 3600;
      // Non-user-related
      case CacheDataKeys.REP_STATS_BY_ID:
        return 3600;
      case CacheDataKeys.REP_VOTES_BY_ID:
        return 3600;
      case CacheDataKeys.SPONSORED_BILLS_BY_REP_ID:
        return 3600;
      case CacheDataKeys.COSPONSORED_BILLS_BY_REP_ID:
        return 3600;
      case CacheDataKeys.REPS_BY_DISTRICT_AND_STATE:
        return 3600;
      case CacheDataKeys.REP_VOTE_ON_BILL:
        return 3600;
      case CacheDataKeys.FEATURED_REPS:
        return 3600;
      default:
        throw new InternalError("Invalid cache key");
    }
  }

  public async setData(
    key: CacheDataKeys,
    data: any,
    keyData: CacheKeyData = {}
  ): Promise<boolean> {
    const cacheKey = this.createCacheKeyFromData(key, keyData);
    const expirationTime = this.getExpirationTimeFromKey(key);
    await this.set(cacheKey, JSON.stringify(data), expirationTime);
    return true;
  }

  public async bustCache(
    key: CacheDataKeys,
    data: CacheKeyData = {}
  ): Promise<boolean> {
    const cacheKey = this.createCacheKeyFromData(key, data);
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
