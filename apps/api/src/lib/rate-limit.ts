import { redisClient as redis } from "@repo/redis";

// This script performs a sliding-window request limit check atomically.
// We use a Lua script so all Redis operations run as a single isolated unit,
// which avoids race conditions that can happen with multi-step client logic.
const REQUEST_SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local member = ARGV[4]

  redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
  local currentCount = redis.call('ZCARD', key)

  if currentCount >= limit then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retryAfterMs = 0

    if oldest[2] then
      retryAfterMs = math.max(0, windowMs - (now - tonumber(oldest[2])))
    end

    return {0, currentCount, retryAfterMs}
  end

  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, windowMs)

  return {1, currentCount + 1, 0}
`;

// This script performs an atomic batch quota check and increment.
// It preserves the event-based minute quota behavior while preventing concurrency drift.
const BATCH_SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local batchSize = tonumber(ARGV[4])
  local randomSuffix = ARGV[5]

  redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
  local currentCount = redis.call('ZCARD', key)

  if currentCount + batchSize > limit then
    return {0, currentCount}
  end

  for i = 1, batchSize do
    redis.call('ZADD', key, now, tostring(now) .. '-' .. tostring(i) .. '-' .. randomSuffix)
  end

  redis.call('PEXPIRE', key, windowMs)

  return {1, currentCount + batchSize}
`;

type RequestLimitResult = {
  allowed: boolean;
  currentCount: number;
  retryAfterMs: number;
};

type BatchQuotaResult = {
  allowed: boolean;
  currentCount: number;
};

// Wrapper around the request script to provide a typed API to the route middleware.
export const checkAndIncrementSlidingWindowRequests = async (
  key: string,
  now: number,
  limit: number,
  windowMs: number,
): Promise<RequestLimitResult> => {
  const member = `${now}-${Math.random().toString(36).substring(2, 7)}`;

  const result = (await redis.send("EVAL", [
    REQUEST_SLIDING_WINDOW_SCRIPT,
    "1",
    key,
    now.toString(),
    windowMs.toString(),
    limit.toString(),
    member,
  ])) as [number | string, number | string, number | string];

  return {
    allowed: Number(result[0]) === 1,
    currentCount: Number(result[1]),
    retryAfterMs: Number(result[2]),
  };
};

// Wrapper around the batch script to provide a typed API to the ingest route.
export const checkAndIncrementSlidingWindowBatch = async (
  key: string,
  now: number,
  limit: number,
  windowMs: number,
  batchSize: number,
): Promise<BatchQuotaResult> => {
  const randomSuffix = Math.random().toString(36).substring(2, 7);

  const result = (await redis.send("EVAL", [
    BATCH_SLIDING_WINDOW_SCRIPT,
    "1",
    key,
    now.toString(),
    windowMs.toString(),
    limit.toString(),
    batchSize.toString(),
    randomSuffix,
  ])) as [number | string, number | string];

  return {
    allowed: Number(result[0]) === 1,
    currentCount: Number(result[1]),
  };
};
