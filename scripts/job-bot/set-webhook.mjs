import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config({ path: '.env.local' });

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

const token = clean(process.env.JOB_BOT_TELEGRAM_TOKEN);
const siteUrl = clean(process.env.JOB_BOT_WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL);
const dropPendingUpdates = !process.argv.includes('--keep-pending');

if (!token) {
  throw new Error('JOB_BOT_TELEGRAM_TOKEN is missing');
}

if (!siteUrl) {
  throw new Error('Set JOB_BOT_WEBHOOK_BASE_URL or NEXT_PUBLIC_SITE_URL first');
}

const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/webhook/job-telegram`;
const secretToken = crypto
  .createHash('sha256')
  .update(`job-telegram-webhook:${token}`)
  .digest('hex');

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: dropPendingUpdates,
  }),
});

const data = await response.json();
console.log(
  JSON.stringify(
    {
      ok: data.ok,
      description: data.description,
      webhookUrl,
      pendingUpdates: dropPendingUpdates ? 'dropped' : 'kept',
    },
    null,
    2
  )
);
