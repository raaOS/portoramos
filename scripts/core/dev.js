#!/usr/bin/env node
/**
 * Dev orchestrator: spawn Next.js dev server + auxiliary poller(s) under a
 * single process so `npm run dev` is enough to make the whole app work
 * locally — including Telegram bot button callbacks that need long-poll
 * delivery in the absence of a public webhook.
 *
 * Children:
 *   - Next.js dev server (always)
 *   - Job hunter Telegram poller (only if JOB_BOT_TELEGRAM_TOKEN is set)
 *
 * Behavior:
 *   - All child stdout/stderr is piped through with a `[name]` prefix so
 *     logs stay readable.
 *   - Before the job bot poller starts, Telegram webhook mode is disabled
 *     with drop_pending_updates=true, then restored to the production HTTPS
 *     webhook when the dev process exits normally.
 *   - The poller auto-restarts on crash (1.5s backoff) so a transient
 *     Telegram timeout doesn't leave buttons unresponsive for the rest
 *     of the dev session.
 *   - Pressing Ctrl+C cleanly terminates every child.
 *   - Skip the poller entirely with `--no-job-bot` (handy when offline).
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function resolveNextCli() {
  try {
    return require.resolve('next/dist/bin/next');
  } catch {
    console.error(
      'Next.js belum terpasang dengan benar. Jalankan ulang `npm install` agar dependency sinkron.'
    );
    process.exit(1);
  }
}

function isFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '0.0.0.0');
  });
}

async function findPort(start = 3000, max = 3000) {
  for (let p = start; p <= max; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(
    'Port 3000 sedang digunakan. Silakan hentikan proses yang menggunakan port 3000 terlebih dahulu.'
  );
}

// Minimal .env loader. We only inspect a handful of keys here, so we don't
// pull in the full `dotenv` dep — children inherit `process.env` unchanged
// regardless of what we do here.
function loadEnvFlag(key) {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) {
        let value = m[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (value) return value;
      }
    }
  }
  return process.env[key] || '';
}

function trimTrailingSlash(value) {
  return value.trim().replace(/\/+$/, '');
}

function buildJobBotWebhookSecret(token) {
  return crypto.createHash('sha256').update(`job-telegram-webhook:${token}`).digest('hex');
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveExpectedJobBotWebhookUrl() {
  const baseUrl = trimTrailingSlash(
    loadEnvFlag('JOB_BOT_WEBHOOK_BASE_URL') || loadEnvFlag('NEXT_PUBLIC_SITE_URL')
  );

  if (!baseUrl || !isHttpsUrl(baseUrl)) return '';
  return `${baseUrl}/api/webhook/job-telegram`;
}

async function telegramRequest(token, method, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      body
        ? {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          }
        : { signal: controller.signal }
    );

    const data = await response.json().catch(() => ({
      ok: false,
      description: `Telegram returned HTTP ${response.status}`,
    }));

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `${method} failed with HTTP ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

const COLOR = {
  reset: '\x1b[0m',
  next: '\x1b[36m', // cyan
  jobBot: '\x1b[35m', // magenta
  warn: '\x1b[33m', // yellow
};

function pipeWithPrefix(child, label, color) {
  const prefix = `${color}[${label}]${COLOR.reset} `;
  const writePrefixed = (stream) => (chunk) => {
    const text = chunk.toString();
    // Avoid splitting in the middle of a line; rely on the stream giving
    // us full lines under normal load. If a partial line slips through it
    // still gets one prefix, which is fine for dev visibility.
    stream.write(text.replace(/^(?!$)/gm, prefix));
  };
  child.stdout?.on('data', writePrefixed(process.stdout));
  child.stderr?.on('data', writePrefixed(process.stderr));
}

const children = new Set();
let shuttingDown = false;
let jobBotWebhookRestore = null;

function trackChild(child) {
  children.add(child);
  child.on('exit', () => children.delete(child));
}

async function prepareJobBotLocalMode(token) {
  let currentWebhookUrl = '';
  let currentPending = 0;

  try {
    const info = await telegramRequest(token, 'getWebhookInfo');
    currentWebhookUrl = info.result?.url || '';
    currentPending = Number(info.result?.pending_update_count ?? 0);
  } catch (error) {
    console.warn(
      `${COLOR.warn}[dev] gagal membaca webhook job bot: ${error.message}. Poller lokal di-skip supaya tidak bentrok.${COLOR.reset}`
    );
    return false;
  }

  const expectedWebhookUrl = resolveExpectedJobBotWebhookUrl();
  const restoreUrl = currentWebhookUrl || expectedWebhookUrl;

  if (currentWebhookUrl && expectedWebhookUrl && currentWebhookUrl !== expectedWebhookUrl) {
    console.warn(
      `${COLOR.warn}[dev] webhook job bot saat ini berbeda dari env. Restore akan memakai URL sebelumnya: ${currentWebhookUrl}${COLOR.reset}`
    );
  }

  if (!restoreUrl || !isHttpsUrl(restoreUrl)) {
    console.warn(
      `${COLOR.warn}[dev] job hunter poller di-skip: tidak ada URL HTTPS untuk restore webhook. Set JOB_BOT_WEBHOOK_BASE_URL=https://domain-vercel atau NEXT_PUBLIC_SITE_URL=https://domain-vercel.${COLOR.reset}`
    );
    return false;
  }

  try {
    await telegramRequest(token, 'deleteWebhook', { drop_pending_updates: true });
    jobBotWebhookRestore = { token, webhookUrl: restoreUrl };
    console.log(
      `${COLOR.warn}[dev] job bot webhook dilepas untuk local polling; pending=${currentPending} dibuang. Restore target: ${restoreUrl}${COLOR.reset}`
    );
    return true;
  } catch (error) {
    console.warn(
      `${COLOR.warn}[dev] gagal melepas webhook job bot: ${error.message}. Poller lokal di-skip supaya tidak konflik getUpdates/webhook.${COLOR.reset}`
    );
    return false;
  }
}

async function restoreJobBotWebhook() {
  if (!jobBotWebhookRestore) return;

  const restore = jobBotWebhookRestore;
  jobBotWebhookRestore = null;

  try {
    await telegramRequest(restore.token, 'setWebhook', {
      url: restore.webhookUrl,
      secret_token: buildJobBotWebhookSecret(restore.token),
      allowed_updates: ['message', 'callback_query'],
      max_connections: 40,
      drop_pending_updates: true,
    });
    console.log(
      `${COLOR.warn}[dev] job bot webhook production dipulihkan: ${restore.webhookUrl}\n` +
        `[dev] cek status webhook + pending: npm run telegram:webhook-info\n` +
        `[dev] recovery kalau status NOT SET/MISMATCH: npm run telegram:set-webhook -- --bot=job${COLOR.reset}`
    );
  } catch (error) {
    console.error(
      `${COLOR.warn}[dev] gagal restore job bot webhook: ${error.message}. Jalankan: npm run telegram:set-webhook -- --bot=job${COLOR.reset}`
    );
  }
}

async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }

  await restoreJobBotWebhook();
  process.exit(code ?? 0);
}

process.on('SIGINT', () => {
  void shutdown(0);
});
process.on('SIGTERM', () => {
  void shutdown(0);
});

function startNextDev(port) {
  const forwardedArgs = process.argv.slice(2).filter((a) => a !== '--no-job-bot');
  const hasBundlerFlag = forwardedArgs.some((arg) =>
    ['--webpack', '--turbopack', '--turbo'].includes(arg)
  );
  const defaultBundlerArgs = process.platform === 'win32' && !hasBundlerFlag ? ['--webpack'] : [];
  const args = [
    resolveNextCli(),
    'dev',
    '-p',
    String(port),
    ...defaultBundlerArgs,
    ...forwardedArgs,
  ];

  const child = spawn(process.execPath, args, { stdio: ['inherit', 'pipe', 'pipe'] });
  pipeWithPrefix(child, 'next', COLOR.next);
  trackChild(child);

  child.on('exit', (code) => {
    // If the dev server dies, take everything down — that's the primary
    // process; the poller alone has no value.
    void shutdown(code ?? 0);
  });
}

async function startJobBotPoller() {
  if (process.argv.includes('--no-job-bot')) {
    console.log(`${COLOR.warn}[dev] job hunter poller di-skip (--no-job-bot)${COLOR.reset}`);
    return;
  }

  const token = loadEnvFlag('JOB_BOT_TELEGRAM_TOKEN');
  if (!token) {
    // Quiet: not every contributor uses the job bot. Mention once so the
    // omission is discoverable without spamming.
    console.log(
      `${COLOR.warn}[dev] job hunter poller di-skip (JOB_BOT_TELEGRAM_TOKEN belum di-set)${COLOR.reset}`
    );
    return;
  }

  const pollerScript = path.resolve(__dirname, '..', 'job-bot', 'poll.ts');
  let backoffMs = 1500;
  const maxBackoffMs = 15000;

  if (!fs.existsSync(pollerScript)) {
    console.log(
      `${COLOR.warn}[dev] job hunter poller di-skip (scripts/job-bot/poll.ts tidak ditemukan)${COLOR.reset}`
    );
    return;
  }

  // tsx ships as a devDependency so we can resolve its CLI directly and
  // skip the slow `npx` PATH lookup. Resolving the file path also lets
  // spawn use Node directly (no shell), which avoids Node 24's deprecation
  // warning around `shell: true` + arg arrays.
  let tsxCli;
  try {
    // tsx exposes the CLI under the `./cli` exports subpath, not the
    // raw dist/* path (which is blocked by package.json `exports`).
    tsxCli = require.resolve('tsx/cli');
  } catch {
    console.log(
      `${COLOR.warn}[dev] tsx tidak terpasang — job hunter poller di-skip. Jalankan \`npm install\` untuk mengaktifkan.${COLOR.reset}`
    );
    return;
  }

  const prepared = await prepareJobBotLocalMode(token);
  if (!prepared) return;

  function spawnPoller() {
    const child = spawn(process.execPath, [tsxCli, pollerScript], {
      stdio: ['inherit', 'pipe', 'pipe'],
      windowsHide: true,
    });
    pipeWithPrefix(child, 'job-bot', COLOR.jobBot);
    trackChild(child);

    child.on('exit', (code, signal) => {
      // Don't relaunch if we're shutting down or user killed it explicitly.
      if (signal === 'SIGTERM' || signal === 'SIGINT') return;
      console.log(
        `${COLOR.warn}[dev] job-bot poller exited (code=${code}). Restarting in ${backoffMs}ms...${COLOR.reset}`
      );
      setTimeout(spawnPoller, backoffMs);
      backoffMs = Math.min(maxBackoffMs, backoffMs * 2);
    });

    // Reset backoff once the child has stayed alive for a while — that
    // signals it's actually working, not just looping on startup errors.
    setTimeout(() => {
      backoffMs = 1500;
    }, 10000);
  }

  spawnPoller();
}

(async () => {
  const port = await findPort().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
  startNextDev(port);
  await startJobBotPoller();
})();
