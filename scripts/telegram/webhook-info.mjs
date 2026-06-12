#!/usr/bin/env node
/**
 * Webhook Info — Tampilkan status webhook dan antrean kedua bot Telegram.
 *
 * @module scripts/telegram/webhook-info
 */
// Show webhook + queue status for both Telegram bots.
//
// Usage:
//   npm run telegram:webhook-info
//   npm run telegram:webhook-info -- --bot=main
//   npm run telegram:webhook-info -- --bot=job

import { parseBotFilter, ensureToken, tg, resolveBaseUrl } from './common.mjs';

const baseUrl = resolveBaseUrl();
const expected = (path) => (baseUrl ? `${baseUrl}${path}` : '(NEXT_PUBLIC_SITE_URL not set)');
const bots = parseBotFilter();

for (const bot of bots) {
  console.log(`\n${bot.label}`);
  console.log('-'.repeat(bot.label.length));
  if (!ensureToken(bot)) continue;

  const data = await tg(bot, 'getWebhookInfo');
  if (!data.ok) {
    console.error(`  error: ${data.description}`);
    continue;
  }
  const info = data.result;
  const expectedUrl = expected(bot.webhookPath);
  const matches = info.url === expectedUrl;

  console.log(`  current url     : ${info.url || '(not set)'}`);
  console.log(`  expected url    : ${expectedUrl}`);
  console.log(`  status          : ${info.url ? (matches ? 'OK' : 'MISMATCH') : 'NOT SET'}`);
  console.log(`  pending updates : ${info.pending_update_count ?? 0}`);
  if (info.last_error_date) {
    const when = new Date(info.last_error_date * 1000).toISOString();
    console.log(`  last error      : ${info.last_error_message} (${when})`);
  }
}
