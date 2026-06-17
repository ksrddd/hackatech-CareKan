import { Router } from 'express';
import { asyncHandler } from '../errors.js';
import { authGuard, roleGuard } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';
import * as hospital from '../controllers/hospital.controller.js';
import * as appt from '../controllers/appointment.controller.js';
import * as admin from '../controllers/admin.controller.js';

export const router = Router();

router.post('/auth/register', asyncHandler(auth.register));
router.post('/auth/login', asyncHandler(auth.login));
router.post('/auth/logout', auth.logout);
router.get('/auth/me', authGuard, asyncHandler(auth.me));

router.get('/hospitals', asyncHandler(hospital.list));
router.get('/hospitals/:id', asyncHandler(hospital.detail));
router.get('/hospitals/:id/time-slots', asyncHandler(hospital.timeSlots));

router.post('/appointments', authGuard, roleGuard('citizen'), asyncHandler(appt.create));
router.get('/appointments/me', authGuard, roleGuard('citizen'), asyncHandler(appt.mine));
router.get('/appointments/:id', authGuard, roleGuard('citizen'), asyncHandler(appt.detail));

router.get('/admin/queue', authGuard, roleGuard('admin'), asyncHandler(admin.queue));
router.patch('/admin/appointments/:id/status', authGuard, roleGuard('admin'), asyncHandler(admin.setStatus));
