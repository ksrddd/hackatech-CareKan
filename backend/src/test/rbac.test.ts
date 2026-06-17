import { describe, it, expect } from 'vitest';
import { ROUTE_ROLES } from '../../../shared/api';

describe('RBAC table parity', () => {
  it('every contract route has a backend role decision documented', () => {
    // Guard against drift: this list must mirror routes/index.ts.
    const implemented = new Set([
      'POST /auth/login', 'POST /auth/register', 'POST /auth/logout', 'GET /auth/me',
      'GET /hospitals', 'GET /hospitals/:id', 'GET /hospitals/:id/time-slots',
      'POST /appointments', 'GET /appointments/me', 'GET /appointments/:id',
      'GET /admin/queue', 'PATCH /admin/appointments/:id/status',
    ]);
    for (const route of Object.keys(ROUTE_ROLES)) {
      expect(implemented.has(route)).toBe(true);
    }
  });
});
