/**
 * Telegram Common — Shared helpers untuk CLI scripts Telegram.
 *
 * Menyediakan helper bersama untuk script telegram: load env, expose
 * token bot utama (@WebPortofolioBot) dan bot job hunter.
 *
 * @module scripts/telegram/common
 */
// Shared helpers for telegram CLI scripts.
// Loads .env.local then .env (Next.js convention) and exposes the two bot
// tokens this project uses: the main "@WebPortofolioBot" and the job hunter
// "@ramos_job_hunter_bot".

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const p = path.resolve(process.cwd(), file);
  if (fs.existsSync(p)) {
    loadEnv({ path: p, override: false });
  }
}

function clean(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export const BOTS = [
  {
    key: 'main',
    label: 'Main Bot (@WebPortofolioBot)',
    token: clean(process.env.TELEGRAM_BOT_TOKEN),
    webhookPath: '/api/webhook/telegram',
    secret(token) {
      // Mirrors src/lib/telegram/index.ts buildTelegramWebhookSecret.
      return crypto.createHash('sha256').update(`telegram-webhook:${token}`).digest('hex');
    },
  },
  {
    key: 'job',
    label: 'Job Hunter Bot (@ramos_job_hunter_bot)',
    token: clean(process.env.JOB_BOT_TELEGRAM_TOKEN),
    webhookPath: '/api/webhook/job-telegram',
    secret(token) {
      // Mirrors src/lib/jobBot/config.ts buildJobBotWebhookSecret.
      return crypto.createHash('sha256').update(`job-telegram-webhook:${token}`).digest('hex');
    },
  },
];

export function resolveBaseUrl() {
  return clean(
    process.env.TELEGRAM_WEBHOOK_BASE_URL ||
      process.env.JOB_BOT_WEBHOOK_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      ''
  ).replace(/\/$/, '');
}

export function parseBotFilter() {
  // CLI flag --bot=main|job|both (default: both)
  const arg = process.argv.find((a) => a.startsWith('--bot='));
  const value = arg ? arg.slice('--bot='.length) : 'both';
  if (value === 'main') return [BOTS[0]];
  if (value === 'job') return [BOTS[1]];
  return BOTS;
}

export function ensureToken(bot) {
  if (!bot.token || !/^\d+:[A-Za-z0-9_-]+$/.test(bot.token)) {
    console.warn(`  [skip] ${bot.label}: token missing/invalid`);
    return false;
  }
  return true;
}

export async function tg(bot, method, body) {
  const url = `https://api.telegram.org/bot${bot.token}/${method}`;
  const res = await fetch(
    url,
    body
      ? {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }
      : undefined
  );
  return res.json();
}
