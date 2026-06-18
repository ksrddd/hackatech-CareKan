import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  // Off by default so the demo (and its fixed demo IDs) keeps working with a
  // plain 13-digit check. Set STRICT_NATIONAL_ID=true to enforce the real
  // Thai national-ID checksum on registration in production.
  strictNationalId: process.env.STRICT_NATIONAL_ID === 'true',
};
