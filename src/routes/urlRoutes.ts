import express from 'express';
import { urlCreationRateLimiter } from '../middlewares/RateLimitMiddleware';
import { authenticateToken } from '../middlewares/AuthMiddleware';
import {
  shortenUrl,
  redirectUrl,
  getUserUrls,
  getUrlAnalytics,
  deleteUrl,
} from '../controllers/UrlController';

const router = express.Router();

/**
 * @swagger
 * /api/url/shorten:
 *   post:
 *     tags:
 *       - URL
 *     summary: Shorten a URL
 *     description: Creates a shortened URL from a long URL
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 description: The original URL to be shortened
 *               customAlias:
 *                 type: string
 *                 description: Optional custom short code (alias)
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the shortened URL
 *     responses:
 *       201:
 *         description: URL shortened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *                   example: https://yourdomain.com/abc123
 *                 originalUrl:
 *                   type: string
 *                   example: https://example.com/very/long/url
 *                 shortCode:
 *                   type: string
 *                   example: abc123
 *       400:
 *         description: Invalid URL or custom alias already in use
 *       429:
 *         description: Rate limit exceeded
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/shorten', authenticateToken, urlCreationRateLimiter, shortenUrl);

/**
 * @swagger
 * /api/url/urls:
 *   get:
 *     tags:
 *       - URL
 *     summary: Get user's URLs
 *     description: Retrieves all shortened URLs created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of user's URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shortCode:
 *                         type: string
 *                       originalUrl:
 *                         type: string
 *                       shortUrl:
 *                         type: string
 *                       clicks:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                 totalCount:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/urls', authenticateToken, getUserUrls);

/**
 * @swagger
 * /api/url/analytics/{shortCode}:
 *   get:
 *     tags:
 *       - URL
 *     summary: Get URL analytics
 *     description: Retrieves detailed analytics for a specific shortened URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The short code of the URL
 *     responses:
 *       200:
 *         description: URL analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortCode:
 *                   type: string
 *                 originalUrl:
 *                   type: string
 *                 totalClicks:
 *                   type: integer
 *                 referrers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 browsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       country:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 clicksOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: URL not found
 */
router.get('/analytics/:shortCode', authenticateToken, getUrlAnalytics);

/**
 * @swagger
 * /api/url/{shortCode}:
 *   get:
 *     tags:
 *       - URL
 *     summary: Redirect to original URL
 *     description: Redirects from short URL to the original URL and records analytics
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The short code of the URL
 *     responses:
 *       302:
 *         description: Redirect to the original URL
 *       404:
 *         description: URL not found or expired
 */
router.get('/:shortCode', redirectUrl);

/**
 * @swagger
 * /api/url/delete/{id}:
 *   delete:
 *     tags:
 *       - URL
 *     summary: Delete a shortened URL
 *     description: Deletes a shortened URL created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the URL to delete
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: URL not found
 */
router.delete('/delete/:id', authenticateToken, deleteUrl);

export { router as urlRoutes };
