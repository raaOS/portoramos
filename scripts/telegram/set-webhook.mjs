#!/usr/bin/env node
// Point Telegram webhooks at the deployed app for one or both bots.
//
// Reads the public base URL from (in order):
//   TELEGRAM_WEBHOOK_BASE_URL > JOB_BOT_WEBHOOK_BASE_URL > NEXT_PUBLIC_SITE_URL
//
// Usage:
//   npm run telegram:set-webhook
//   npm run telegram:set-webhook -- --bot=main
//   npm run telegram:set-webhook -- --bot=job
//   npm run telegram:set-webhook -- --base=https://mydomain.com

import { parseBotFilter, ensureToken, tg, resolveBaseUrl } from './common.mjs';

function parseBaseFlag() {
  const arg = process.argv.find((a) => a.startsWith('--base='));
  return arg ? arg.slice('--base='.length).replace(/\/$/, '') : '';
}

const baseUrl = parseBaseFlag() || resolveBaseUrl();
if (!baseUrl) {
  console.error('Set NEXT_PUBLIC_SITE_URL (or pass --base=https://...).');
  process.exit(1);
}

if (!/^https:\/\//.test(baseUrl)) {
  console.error(`Base URL must be HTTPS. Got: ${baseUrl}`);
  process.exit(1);
}

const bots = parseBotFilter();

for (const bot of bots) {
  console.log(`\n${bot.label}`);
  console.log('-'.repeat(bot.label.length));
  if (!ensureToken(bot)) continue;

  const url = `${baseUrl}${bot.webhookPath}`;
  const secret = bot.secret(bot.token);

  const data = await tg(bot, 'setWebhook', {
    url,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    max_connections: 40,
    drop_pending_updates: false,
  });

  if (data.ok) {
    console.log(`  set -> ${url}`);
  } else {
    console.error(`  failed: ${data.description}`);
  }
}
