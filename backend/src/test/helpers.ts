import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.test', override: true });

import { buildApp } from '../app.js';

export function makeTestApp() {
  return buildApp();
}
