import { redisClient } from "@repo/redis";

const CACHE_PREFIX = "dashboard:";

interface CacheStats {
  hits: number;
  misses: number;
}

const stats: CacheStats = { hits: 0, misses: 0 };

export const getCacheStats = (): CacheStats => ({ ...stats });

export const getOrSetCache = async <T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> => {
  const fullKey = `${CACHE_PREFIX}${key}`;

  const cached = await redisClient.get(fullKey);
  if (cached !== null) {
    console.debug(`[cache] HIT key=${key}`);
    stats.hits++;
    return JSON.parse(cached) as T;
  }

  console.debug(`[cache] MISS key=${key}`);
  stats.misses++;
  const result = await compute();

  await redisClient.setex(fullKey, ttlSeconds, JSON.stringify(result));

  return result;
};

export const invalidateCache = async (pattern: string): Promise<number> => {
  const fullPattern = `${CACHE_PREFIX}${pattern}`;
  const keys = await redisClient.keys(fullPattern);

  if (keys.length === 0) return 0;

  await redisClient.del(...keys);
  return keys.length;
};
