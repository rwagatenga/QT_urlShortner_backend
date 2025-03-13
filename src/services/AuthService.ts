import { CreationAttributes, Op } from 'sequelize';
import { User } from '../models/User';
import sequelize from '../config/sequelizer';
import { Url } from '../models/Url';
import { UrlAnalytics } from '../models/UrlAnalytics';

export class AuthService {
  async findAllUsers(includeDeleted = false) {
    return await User.findAll({
      paranoid: !includeDeleted,
      attributes: {
        exclude: ['password', 'emailVerificationToken', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      include: [
        {
          model: Url,
          include: [{ model: UrlAnalytics }],
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt'],
          },
        },
      ],
    });
  }

  async findUserById(id: string, includeDeleted = false) {
    return await User.findByPk(id, {
      paranoid: !includeDeleted,
      attributes: {
        exclude: ['password', 'emailVerificationToken', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      include: [
        {
          model: Url,
          include: [{ model: UrlAnalytics }],
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt'],
          },
        },
      ],
    });
  }

  async findUserByEmail(email: string, username?: string, includeDeleted = false) {
    let whereClause;

    if (email && username) {
      whereClause = { [Op.or]: [{ email }, { username }] };
    } else if (email) {
      whereClause = { email };
    } else if (username) {
      whereClause = { username };
    } else {
      throw new Error('Either email or username must be provided');
    }

    return await User.findOne({
      where: whereClause,
      paranoid: !includeDeleted,
      attributes: {
        exclude: ['password', 'emailVerificationToken', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      include: [
        {
          model: Url,
          include: [{ model: UrlAnalytics }],
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt'],
          },
        },
      ],
    });
  }

  async findUserByEmailToken(emailVerificationToken: string, includeDeleted = false) {
    return await User.findOne({
      where: { emailVerificationToken },
      paranoid: !includeDeleted,
      attributes: {
        exclude: ['password', 'emailVerificationToken', 'createdAt', 'updatedAt', 'deletedAt'],
      },
      include: [
        {
          model: Url,
          include: [{ model: UrlAnalytics }],
          attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt'],
          },
        },
      ],
    });
  }

  async createUser(userData: CreationAttributes<User>) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.create(userData, { transaction });

      await transaction.commit();
      return await this.findUserById(user.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>) {
    await User.update(updates, { where: { id } });
    return await User.findByPk(id);
  }

  async updateLastLogin(id: string) {
    await User.update({ lastLogin: new Date() }, { where: { id } });
    return await this.findUserById(id);
  }

  async deleteUser(id: string) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(id, { transaction });

      if (user) {
        await user.destroy({ transaction });
        await transaction.commit();
        return true;
      }

      await transaction.rollback();
      return false;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async verifyUserByEmailToken(token: string) {
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) throw new Error('Invalid or expired token');
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    return user;
  }
}
