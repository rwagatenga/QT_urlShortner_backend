import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import http from 'http';
import session from 'express-session';
import passport from 'passport';
import hpp from 'hpp';
import xss from 'xss';

import { initializePassport } from './utils/passport';
import router from './routes/routes';
import { swaggerUi, swaggerDocs } from './config/swagger';
import sequelize from './config/sequelizer';
import logger from './utils/logger';
import { globalRateLimiter } from './middlewares/RateLimitMiddleware';

interface StringKeyedObject {
  [key: string]: unknown;
}

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(helmet());
app.use(hpp());

app.use((req: Request, res: Response, next: NextFunction) => {
  const sanitize = (input: unknown): unknown => {
    return typeof input === 'string' ? xss(input) : input;
  };

  const sanitizeObject = (obj: StringKeyedObject): void => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        obj[key] = sanitize(obj[key]);
      });
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
});

app.use(globalRateLimiter);

app.use(
  cors({
    origin: ['http://localhost:8080', 'http://localhost:5173/'],
    credentials: true,
  })
);

app.use(express.json());

io.on('connection', (socket) => {
  logger.info('A user connected');
  socket.on('disconnect', () => {
    logger.info('User disconnected');
  });
});

sequelize
  .authenticate()
  .then(() => logger.info('Connection has been established successfully.'))
  .catch((err) => {
    logger.error('Unable to connect to the database:', err);
    setTimeout(() => sequelize.authenticate(), 5000);
  });

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});
