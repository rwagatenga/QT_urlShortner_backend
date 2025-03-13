import Redis from 'ioredis';
import logger from '../utils/logger';
import { Url } from 'url';
import { UrlAnalytics } from '../models/UrlAnalytics';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisUrl = process.env.REDIS_URL || `redis://${redisHost}:${redisPort}`;

const redis = new Redis(redisUrl);

redis.on('error', (err: unknown) => {
  logger.error('Redis connection error:', err);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

const DEFAULT_EXPIRATION = 3600;

export const cacheUrl = async (
  shortCode: string,
  originalUrl: string,
  expiration: number = DEFAULT_EXPIRATION
): Promise<void> => {
  try {
    await redis.setex(`url:${shortCode}`, expiration, originalUrl);
  } catch (error) {
    logger.error('Error caching URL:', error);
  }
};

export const getCachedUrl = async (shortCode: string): Promise<string | null> => {
  try {
    return await redis.get(`url:${shortCode}`);
  } catch (error) {
    logger.error('Error retrieving cached URL:', error);
    return null;
  }
};

export const removeCachedUrl = async (shortCode: string): Promise<void> => {
  try {
    await redis.del(`url:${shortCode}`);
  } catch (error) {
    logger.error('Error removing cached URL:', error);
  }
};

export const cacheAnalytics = async (
  urlId: string,
  data: Partial<UrlAnalytics>,
  expiration: number = DEFAULT_EXPIRATION
): Promise<void> => {
  try {
    await redis.setex(`analytics:${urlId}`, expiration, JSON.stringify(data));
  } catch (error) {
    logger.error('Error caching analytics:', error);
  }
};

export const getCachedAnalytics = async (
  urlId: string
): Promise<{
  url: Url;
  totalClicks: number;
  analytics: UrlAnalytics[];
  referrerStats: UrlAnalytics[];
  countryStats: UrlAnalytics[];
  clicksByDay: UrlAnalytics[];
} | null> => {
  try {
    const data = await redis.get(`analytics:${urlId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Error retrieving cached analytics:', error);
    return null;
  }
};

export default {
  cacheUrl,
  getCachedUrl,
  removeCachedUrl,
  cacheAnalytics,
  getCachedAnalytics,
};
