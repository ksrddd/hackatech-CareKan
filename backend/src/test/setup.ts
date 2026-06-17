// Load test environment variables before any module is initialized.
// This must run before src/prisma.ts creates its PrismaClient singleton,
// so that the test DB (carekan_test) is used instead of the dev DB (carekan).
import { config } from 'dotenv';
config({ path: '.env.test', override: true });
