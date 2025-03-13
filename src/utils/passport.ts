import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../services/AuthService';
import { User } from '../models/User';
import { CreationAttributes } from 'sequelize';

const authService = new AuthService();

export const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.REDIRECT_URI,
        passReqToCallback: true,
      },
      async (
        req,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (
          error: unknown,
          user?: Express.User | false,
          info?: { message: string } & Partial<passport.AuthInfo>
        ) => void
      ) => {
        try {
          const isSignup = req.query.state === 'signup';
          const email = profile.emails?.[0].value;

          if (!email) {
            return done(null, false, { message: 'Email is required.' });
          }

          const existingUser = await authService.findUserByEmail(email);

          if (isSignup) {
            if (existingUser) {
              return done(null, false, { message: 'Account already exists. Please login.' });
            }

            const userObj = {
              email,
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              isEmailVerified: true,
              isActive: true,
              lastLogin: new Date(),
              avatar: profile.profileUrl ?? null,
            } as unknown as CreationAttributes<User>;

            const newUser = await authService.createUser(userObj);
            return done(null, newUser as unknown as Express.User, {
              message: 'User signed up successfully.',
              accessToken,
              refreshToken,
            });
          } else {
            if (!existingUser) {
              return done(null, false, {
                message: 'No account found. Please sign up first.',
              });
            }

            // Update user's last login
            await authService.updateUser(existingUser.id, {
              lastLogin: new Date(),
              isActive: true,
            });

            const updatedUser = await authService.findUserById(existingUser.id); // Fetch the updated user

            return done(null, updatedUser as Express.User, {
              message: 'User logged in successfully.',
              accessToken,
              refreshToken,
            });
          }
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.findUserById(id);
      if (user) {
        if (!user) return done(null, false);
        done(null, user as unknown as Express.User);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error, null);
    }
  });
};
