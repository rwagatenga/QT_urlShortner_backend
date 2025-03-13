import { Request, Response } from 'express';
import { isUri } from 'valid-url';
import { generate } from 'shortid';
import { UrlService } from '../services/UrlService';
import { getClientIp } from '../utils/URLUtils';
import logger from '../utils/logger';
import {
  cacheUrl,
  getCachedUrl,
  removeCachedUrl,
  cacheAnalytics,
  getCachedAnalytics,
} from '../services/CacheService';
import { Url } from '../models/Url';

const urlService = new UrlService();

export const shortenUrl = async (req: Request, res: Response): Promise<void> => {
  const baseUrl = process.env.BASE_URL!;
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { originalUrl } = req.body;

    if (!originalUrl) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    if (!isUri(baseUrl)) {
      res.status(401).json('Invalid base url');
      return;
    }

    if (!isUri(originalUrl)) {
      throw new Error('Invalid URL provided');
    }

    let shortCode = generate();
    const existingUrl = await urlService.getUrlByShortCode(shortCode);

    if (existingUrl) {
      shortCode = generate();
    }

    const shortUrl = await urlService.createShortUrl(userId, originalUrl, shortCode);

    await cacheUrl(shortCode, originalUrl);

    res.status(201).json({
      success: true,
      data: {
        id: shortUrl.id,
        shortCode: shortUrl.shortCode,
        originalUrl: shortUrl.originalUrl,
        fullShortUrl: `${process.env.BASE_URL!}/${shortUrl.shortCode}`,
        clicks: shortUrl.clicks,
        createdAt: shortUrl.createdAt,
      },
    });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create shortened URL',
    });
    return;
  }
};

export const redirectUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    const cachedUrl = await getCachedUrl(shortCode);

    if (cachedUrl) {
      urlService
        .getUrlByShortCode(shortCode)
        .then((url) => {
          if (url) {
            urlService
              .trackUrlClick(url.id, {
                referrer: req.headers.referer || null,
                userAgent: req.headers['user-agent'] || null,
                ipAddress: getClientIp(req),
                country: null,
                city: null,
              })
              .catch((err) => {
                logger.error('Error tracking URL click:', err);
              });
          }
        })
        .catch((err) => {
          logger.error('Error fetching URL for tracking:', err);
        });

      return res.redirect(cachedUrl);
    }

    const url = await urlService.getUrlByShortCode(shortCode);

    if (!url) {
      return res.status(404).render('not-found');
    }

    await cacheUrl(shortCode, url.originalUrl);

    urlService
      .trackUrlClick(url.id, {
        referrer: req.headers.referer || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: getClientIp(req),
        country: null,
        city: null,
      })
      .catch((err) => {
        logger.error('Error tracking URL click:', err);
      });

    return res.redirect(url.originalUrl);
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to redirect',
    });
    return;
  }
};

export const getUserUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { urls, totalCount } = await urlService.getUrlsByUserId(userId, limit, offset);

    const formattedUrls = urls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: `${process.env.BASE_URL!}/api/url/${url.shortCode}`,
      clicks: url.clicks,
      createdAt: url.createdAt,
      user: url.user,
    }));

    res.status(200).json({
      success: true,
      urls: formattedUrls,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch URLs',
    });
    return;
  }
};

export const getUrlAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { shortCode } = req.params;
    const url = await urlService.getUrlByShortCode(shortCode);

    if (!url) {
      res.status(404).json({
        success: false,
        error: 'URL not found',
      });
      return;
    }

    if (url.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to view analytics for this URL',
      });
      return;
    }

    const cachedAnalytics = await getCachedAnalytics(url.id);
    if (cachedAnalytics) {
      res.status(200).json({
        success: true,
        data: cachedAnalytics,
        source: 'cache',
      });
      return;
    }

    const analytics = await urlService.getUrlAnalytics(url.id);
    await cacheAnalytics(url.id, analytics);

    res.status(200).json({
      success: true,
      data: analytics,
      source: 'database',
    });
    return;
  } catch (error: unknown) {
    logger.error(error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
    return;
  }
};

export const deleteUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const url = await Url.findByPk(id);

    if (url && url.shortCode) {
      await removeCachedUrl(url.shortCode);
    }

    await urlService.deleteUrl(id, userId);

    res.status(200).json({
      success: true,
      message: 'URL deleted successfully',
    });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete URL',
    });
    return;
  }
};
