import 'passport';

declare global {
  namespace Express {
    interface User {
      id: string;
      userId?: string | null;
      firstName: string;
      lastName: string;
      username: string | null;
      email: string;
      isEmailVerified: boolean;
      emailVerificationToken?: string | null;
      isActive: boolean;
      lastLogin: Date;
      avatar?: string | null;
    }
    interface Request {
      user?: User;
    }
  }
}

declare module 'passport' {
  interface AuthInfo {
    accessToken: string;
    refreshToken: string;
  }
}
