import { Redis } from "ioredis";
import { redis } from "../utils/redis.js";

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
