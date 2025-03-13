import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthService } from '../services/AuthService';
import { sendVerificationEmail } from '../utils/emailService';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenService';
import logger from '../utils/logger';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

const authService = new AuthService();

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, avatar, username } = req.body;

    const userExists = await authService.findUserByEmail(email, username);
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const userObj = {
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
      isActive: true,
      lastLogin: new Date(),
      avatar: avatar ?? null,
    };

    const user = await authService.createUser(userObj);

    if (user) {
      await sendVerificationEmail(user.email, verificationToken);
      res.status(200).json({ message: 'User registered.', data: user });
    }
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token: string };
    const user = await authService.findUserByEmailToken(token);
    if (!user) {
      res.status(404).json({ message: 'token not found or experied' });
      return;
    }
    const verifiedUser = await authService.verifyUserByEmailToken(token);
    if (!verifiedUser) {
      res.status(404).json({ message: 'E-mail verification failed' });
      return;
    }
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.status(200).json({
      data: verifiedUser,
      accessToken,
      refreshToken,
      message: 'Email verified successfully.',
    });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(400).json({ error: 'Unable to verify the E-Mail' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await authService.findUserByEmail(email);
    if (!user || !(user.password && (await bcrypt.compare(password, user?.password)))) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user?.isEmailVerified) {
      res.status(403).json({ error: 'Email not verified' });
    }

    if (user) {
      const updatedUser = await authService.updateLastLogin(user.id);
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      res.status(200).json({ data: updatedUser, accessToken, refreshToken });
    }
  } catch (error) {
    logger.error(error instanceof Error && error.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const googleSignup = passport.authenticate('google', {
  scope: ['profile', 'email'],
  state: 'signup',
});

export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  state: 'login',
});

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'google',
    async (
      err: Error,
      user: Express.User,
      info: { message: string } & Partial<passport.AuthInfo>
    ) => {
      if (err) {
        console.error('Google authentication error:', err);
        return res.redirect(
          `${process.env.FRONTEND_URL!}/google-callback?error=${encodeURIComponent(err.message)}`
        );
      }

      try {
        if (!user) {
          const errorMessage = info?.message || 'Authentication failed';
          return res.redirect(
            `${process.env.FRONTEND_URL!}/google-callback?error=${encodeURIComponent(errorMessage)}`
          );
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);

          const state = req.query.state?.toString() || 'login';
          const successRedirect = state === 'signup' ? '/dashboard' : '/dashboard';

          return res.redirect(
            `${process.env.FRONTEND_URL!}/google-callback?` +
              `accessToken=${accessToken}&` +
              `refreshToken=${refreshToken}&` +
              `success=${encodeURIComponent(info.message)}&` +
              `redirect=${encodeURIComponent(successRedirect)}`
          );
        });
      } catch (error) {
        console.error('Token generation error:', error);
        return res.redirect(
          `${process.env.FRONTEND_URL!}/google-callback?error=Token%20generation%20failed`
        );
      }
    }
  )(req, res, next);
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token missing' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      res.status(403).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const user = await authService.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await authService.updateLastLogin(refreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
    return;
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal server error' });
    return;
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { firstName, lastName, email, avatar } = req.body;

  const user = await authService.findUserById(id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  try {
    const updatedUser = await authService.updateUser(id, { firstName, lastName, email, avatar });
    res.status(200).json({ data: updatedUser });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(403).json({ error: 'Invalid Update User' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const user = await authService.findUserById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const deleted = await authService.deleteUser(id);
    if (deleted) {
      res.status(200).json({ message: 'User deleted successfully' });
      return;
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error: unknown) {
    logger.error(error instanceof Error && error.message);
    res.status(403).json({ error: 'Invalid delete user' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }
    const user = await authService.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    res.status(200).json({
      success: true,
      user,
    });
    return;
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
    return;
  }
};
