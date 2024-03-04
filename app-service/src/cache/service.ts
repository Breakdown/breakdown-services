import bcrypt from "bcryptjs";
import { Redis } from "ioredis";
import { redis } from "../utils/redis.js";
import InternalError from "../utils/errors/InternalError.js";

export enum CacheDataKeys {
  PROPUBLICA_FETCH_BILLS, // No need to bust
  PROPUBLICA_SUBJECTS_FOR_BILL, // No need to bust
  PROPUBLICA_FETCH_COSPONSORS_FOR_BILL, // No need to bust
  PROPUBLICA_FETCH_VOTES_FOR_BILL, // No need to bust
  PROPUBLICA_FETCH_MEMBERS, // No need to bust
  PROPUBLICA_FETCH_REP_VOTES_FOR_BILL_VOTE, // No need to bust
  // User-related
  BILLS_FOR_USER, // BUSTED - Bust when user follows or unfollows a bill, user follows a rep or issue, or changes location
  LOCAL_REPS, // BUSTED - Bust when location changes
  USER_FOLLOWING_ISSUES, // BUSTED - Bust when user follows or unfollows an issue
  USER_FOLLOWING_REPS, // BUSTED - Bust when user follows or unfollows a rep
  USER_FOLLOWING_BILLS, // BUSTED - Bust when user follows or unfollows a bill
  // Non-user-related
  BILL_SPONSOR, // TODO: Bust when bill sponsor changes - job
  BILL_COSPONSORS, // TODO: Bust when bill cosponsors change - job
  BILLS_FOR_ISSUE, // TODO: Bust when issue changes on bill - job
  ALL_ISSUES, // TODO: Bust when issue is created or deleted
  USERS_INTERESTED_IN_BILL, // BUSTED - Bust when user follows or unfollows a bill, their reps change, their following reps change, following issues change
  REP_STATS_BY_ID, // BUSTED - Bust when stats are updated - job
  REP_VOTES_BY_ID, // BUSTED - Bust when rep votes are updated - job
  SPONSORED_BILLS_BY_REP_ID, // TODO: Bust when sponsor changes on bill where sponsor ID is rep ID - job
  COSPONSORED_BILLS_BY_REP_ID, // TODO: Bust when cosponsor changes on bill where cosponsor ID is rep ID - job
  REPS_BY_STATE_AND_DISTRICT, // TODO: Bust when new reps are elected in state and district - job
  REP_VOTE_ON_BILL, // BUSTED - Bust when rep vote on bill changes - job
  FEATURED_REPS, // TODO: Bust when any featured rep status changes
}

interface CacheKeyData {
  billId?: string;
  userId?: string;
  issueId?: string;
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
      issueId,
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
      case CacheDataKeys.USER_FOLLOWING_ISSUES:
        return this.hashKey(`user_following_issues:${userId}`);
      case CacheDataKeys.USER_FOLLOWING_REPS:
        return this.hashKey(`user_following_reps:${userId}`);
      case CacheDataKeys.USER_FOLLOWING_BILLS:
        return this.hashKey(`user_following_bills:${userId}`);
      // Non-user-related
      case CacheDataKeys.ALL_ISSUES:
        return this.hashKey(`all_issues`);
      case CacheDataKeys.BILL_SPONSOR:
        return this.hashKey(`bill_sponsor:${billId}`);
      case CacheDataKeys.BILL_COSPONSORS:
        return this.hashKey(`bill_cosponsors:${billId}`);
      case CacheDataKeys.BILLS_FOR_ISSUE:
        return this.hashKey(`bills_for_issue:${issueId}`);
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
      case CacheDataKeys.USER_FOLLOWING_ISSUES:
        return 60 * 60 * 24 * 7; // 1 week
      case CacheDataKeys.USER_FOLLOWING_REPS:
        return 60 * 60 * 24 * 7; // 1 week
      case CacheDataKeys.USER_FOLLOWING_BILLS:
        return 60 * 60 * 24 * 7; // 1 week
      // Non-user-related
      case CacheDataKeys.ALL_ISSUES:
        return 60 * 60 * 24 * 7; // 1 Week
      case CacheDataKeys.BILL_SPONSOR:
        return 3600;
      case CacheDataKeys.BILL_COSPONSORS:
        return 3600;
      case CacheDataKeys.BILLS_FOR_ISSUE:
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
        return 60 * 60 * 24 * 7; // 1 week
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
