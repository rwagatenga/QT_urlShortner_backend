import express from 'express';

import { authRoutes } from './authRoutes';
import { urlRoutes } from './urlRoutes';

const router = express.Router();

const authPath = '/auth';
const urlPath = '/url';

// Public Routes
router.use(authPath, authRoutes);
router.use(urlPath, urlRoutes);

export default router;
