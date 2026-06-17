import { Router } from 'express';
import { asyncHandler } from '../errors.js';
import { authGuard } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

export const router = Router();

router.post('/auth/register', asyncHandler(auth.register));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authGuard, asyncHandler(auth.me));
