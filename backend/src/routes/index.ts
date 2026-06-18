import { Router } from 'express';
import { asyncHandler } from '../errors.js';
import { authGuard } from '../middleware/auth.js';
import { apiKeyGuard } from '../middleware/apiKeyAuth.js';
import * as auth from '../controllers/auth.controller.js';
import * as hospital from '../controllers/hospital.controller.js';
import * as appt from '../controllers/appointment.controller.js';
import * as apiKey from '../controllers/apiKey.controller.js';

export const router = Router();

router.post('/auth/register', asyncHandler(auth.register));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authGuard, asyncHandler(auth.me));

router.get('/hospitals', asyncHandler(hospital.list));
router.get('/hospitals/:id', asyncHandler(hospital.detail));
router.get('/hospitals/:id/time-slots', asyncHandler(hospital.timeSlots));

router.post('/appointments', authGuard, asyncHandler(appt.create));
router.get('/appointments/me', authGuard, asyncHandler(appt.mine));
router.get('/appointments/:id', authGuard, asyncHandler(appt.detail));

// ── API key issuance ───────────────────────────────────────────────

router.post('/api-keys/requests', authGuard, asyncHandler(apiKey.submit));
router.get('/api-keys/requests', authGuard, asyncHandler(apiKey.myRequests));
router.get('/api-keys/requests/:id/export', authGuard, asyncHandler(apiKey.exportMyRequest));
router.get('/api-keys/verify', asyncHandler(apiKey.verify));
router.post('/api-keys/verify', asyncHandler(apiKey.verify));
router.get('/api-keys', authGuard, asyncHandler(apiKey.myKeys));
router.post('/api-keys/:id/revoke', authGuard, asyncHandler(apiKey.revoke));
router.post('/api-keys/:id/regenerate', authGuard, asyncHandler(apiKey.regenerate));

router.get('/queue/all', apiKeyGuard('read_queue'), asyncHandler(apiKey.queueAll));
