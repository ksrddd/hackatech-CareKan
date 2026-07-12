import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'Missing env var: DATABASE_URL'),
  JWT_SECRET: z.string().min(1, 'Missing env var: JWT_SECRET'),
  LINE_CHANNEL_SECRET: z.string().default(''),
  LINE_CHANNEL_TOKEN: z.string().default(''),
  LIFF_ID: z.string().default(''),
  GOOGLE_APPS_SCRIPT_URL: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

/** ให้ process ตายตอน boot ถ้า env ขาด — ดีกว่าตายตอนมี request เข้า */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment: ${missing}`);
  }
  return result.data;
}
