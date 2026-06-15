#!/usr/bin/env node
/**
 * Clear Pending — Hapus antrean update tertunda di Telegram.
 *
 * Membuang semua pending updates dari queue Telegram tanpa mengubah
 * konfigurasi webhook, menggunakan deleteWebhook+setWebhook round-trip.
 *
 * @module scripts/telegram/clear-pending
 */
// Drop pending updates from Telegram's queue without touching the webhook
// configuration. Implemented as a deleteWebhook+setWebhook round-trip when a
// webhook is set, so the bot keeps responding afterwards.
//
// Usage:
//   npm run telegram:clear-pending
//   npm run telegram:clear-pending -- --bot=main
//   npm run telegram:clear-pending -- --bot=job

import { parseBotFilter, ensureToken, tg } from './common.mjs';

const bots = parseBotFilter();

for (const bot of bots) {
  console.log(`\n${bot.label}`);
  console.log('-'.repeat(bot.label.length));
  if (!ensureToken(bot)) continue;

  // Snapshot the current webhook so we can restore it after dropping the
  // queue. If there's no webhook (polling mode), we just consume updates
  // by acknowledging them via getUpdates with a high offset.
  const info = await tg(bot, 'getWebhookInfo');
  const currentUrl = info.ok ? info.result.url || '' : '';
  const pending = info.ok ? (info.result.pending_update_count ?? 0) : 0;

  if (pending === 0) {
    console.log('  queue already empty');
    continue;
  }

  if (currentUrl) {
    // Webhook mode: deleteWebhook with drop_pending, then re-set the same URL.
    const drop = await tg(bot, 'deleteWebhook', { drop_pending_updates: true });
    if (!drop.ok) {
      console.error(`  failed to drop: ${drop.description}`);
      continue;
    }
    const reset = await tg(bot, 'setWebhook', {
      url: currentUrl,
      secret_token: bot.secret(bot.token),
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40,
      drop_pending_updates: false,
    });
    if (!reset.ok) {
      console.error(`  webhook re-set failed: ${reset.description}`);
      continue;
    }
    console.log(`  cleared ${pending} update(s); webhook restored`);
  } else {
    // Polling mode: blow past the queue with a long-poll offset jump.
    const updates = await tg(bot, `getUpdates?offset=-1&limit=1`);
    const lastId =
      updates.ok && updates.result.length > 0
        ? updates.result[updates.result.length - 1].update_id
        : 0;
    if (lastId > 0) {
      await tg(bot, `getUpdates?offset=${lastId + 1}&limit=1`);
    }
    console.log(`  cleared ~${pending} update(s) via offset advance`);
  }
}
