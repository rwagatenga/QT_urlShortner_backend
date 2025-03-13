import { Op } from 'sequelize';
import { Url } from '../models/Url';
import { UrlAnalytics } from '../models/UrlAnalytics';
import sequelize from '../config/sequelizer';
import { User } from '../models/User';

export class UrlService {
  async createShortUrl(userId: string, originalUrl: string, shortCode: string) {
    const url = await Url.create({
      userId,
      shortCode,
      originalUrl,
      clicks: 0,
    });

    return url;
  }

  async getUrlByShortCode(shortCode: string) {
    const url = await Url.findOne({
      where: {
        [Op.or]: [{ shortCode }, { originalUrl: shortCode }],
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: { exclude: ['password', 'emailVerificationToken'] }, // Exclude sensitive fields
        },
      ],
    });
    return url;
  }

  async trackUrlClick(urlId: string, analyticsData: Partial<UrlAnalytics>) {
    const transaction = await sequelize.transaction();

    try {
      await Url.increment('clicks', {
        by: 1,
        where: { id: urlId },
        transaction,
      });

      await UrlAnalytics.create(
        {
          urlId,
          ...analyticsData,
        },
        { transaction }
      );

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getUrlsByUserId(userId: string, limit: number, offset: number) {
    const { count, rows } = await Url.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: { exclude: ['password', 'emailVerificationToken'] },
        },
      ],
    });

    return { urls: rows, totalCount: count };
  }

  async getUrlAnalytics(urlId: string) {
    const url = await Url.findByPk(urlId);

    if (!url) {
      throw new Error('URL not found');
    }

    // 🔍 Log Clicks Count Directly From The Database
    const totalClicksFromAnalytics = await UrlAnalytics.count({ where: { urlId } });

    const analytics = await UrlAnalytics.findAll({
      where: { urlId },
      order: [['clickedAt', 'DESC']],
    });

    const referrerStats = await UrlAnalytics.findAll({
      attributes: ['referrer', [sequelize.fn('COUNT', sequelize.col('referrer')), 'count']],
      where: { urlId, referrer: { [Op.not]: null } },
      group: ['referrer'],
      order: [[sequelize.literal('count'), 'DESC']],
    });

    const countryStats = await UrlAnalytics.findAll({
      attributes: ['country', [sequelize.fn('COUNT', sequelize.col('country')), 'count']],
      where: { urlId, country: { [Op.not]: null } },
      group: ['country'],
      order: [[sequelize.literal('count'), 'DESC']],
    });

    const clicksByDay = await UrlAnalytics.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('clickedAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { urlId },
      group: [sequelize.fn('DATE', sequelize.col('clickedAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('clickedAt')), 'ASC']],
    });

    return {
      url,
      totalClicks: totalClicksFromAnalytics,
      analytics,
      referrerStats,
      countryStats,
      clicksByDay,
    };
  }

  async deleteUrl(urlId: string, userId: string) {
    const url = await Url.findOne({
      where: { id: urlId, userId },
    });

    if (!url) {
      throw new Error('URL not found or you do not have permission to delete it');
    }

    await url.destroy();
    return true;
  }
}
