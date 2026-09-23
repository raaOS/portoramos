/**
 * Job Bot Poller — Long-polling Telegram updates untuk Job Hunter Bot.
 *
 * Menjalankan long-polling terhadap Telegram Bot API untuk menerima
 * dan memproses update perintah job hunter secara lokal.
 *
 * @module scripts/job-bot/poll
 */
import dns from 'dns';
import dotenv from 'dotenv';
import { Agent, ProxyAgent, buildConnector, setGlobalDispatcher } from 'undici';
import { getJobBotConfig } from '../../src/lib/jobBot/config';
import { handleJobBotUpdate, type JobBotUpdate } from '../../src/lib/jobBot/handler';

// Force DNS publik agar api.telegram.org tidak diblokir DNS router/ISP.
// dns.setServers hanya mempengaruhi dns.resolve*, bukan dns.lookup (yang
// dipakai fetch/undici secara default). Maka kita harus pakai buildConnector
// dengan custom lookup agar Undici juga pakai DNS publik.
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);

const connector = buildConnector({
  timeout: 30000,
  lookup: (hostname: string, _opts: unknown, cb: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family: number) => void) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) {
        return dns.lookup(hostname, { family: 4 }, cb);
      }
      cb(null, [{ address: addresses[0], family: 4 }], 4);
    });
  },
});

dotenv.config({ path: '.env.local', quiet: true });

// Setup Undici dispatcher dengan custom DNS lookup + extended timeout
const proxyUrl =
  process.env.TELEGRAM_PROXY ||
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.ALL_PROXY;

if (proxyUrl) {
  setGlobalDispatcher(
    new ProxyAgent({
      uri: proxyUrl,
      connect: connector,
      headersTimeout: 60000,
      bodyTimeout: 60000,
    })
  );
} else {
  setGlobalDispatcher(
    new Agent({
      connect: connector,
      headersTimeout: 60000,
      bodyTimeout: 60000,
    })
  );
}

interface TelegramUpdate extends JobBotUpdate {
  update_id: number;
}

async function getUpdates(botToken: string, offset?: number): Promise<TelegramUpdate[]> {
  const params = new URLSearchParams({
    timeout: '25',
    allowed_updates: JSON.stringify(['message', 'callback_query']),
  });

  if (typeof offset === 'number') {
    params.set('offset', String(offset));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?${params.toString()}`,
      { signal: controller.signal }
    );
    const data = (await response.json()) as {
      ok: boolean;
      result?: TelegramUpdate[];
      description?: string;
    };

    if (!data.ok) {
      throw new Error(data.description || 'Telegram getUpdates failed');
    }

    return data.result ?? [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const config = getJobBotConfig();
  let offset: number | undefined;

  console.log('[JobBot Poll] Started. Press Ctrl+C to stop.');
  console.log(
    '[JobBot Poll] Allowed chat:',
    config.adminChatId,
    'thread:',
    config.threadId ?? '(any)'
  );

  while (true) {
    try {
      const updates = await getUpdates(config.botToken, offset);

      for (const update of updates) {
        offset = update.update_id + 1;

        // Log setiap update yang masuk untuk visibility
        const msg = update.message;
        if (msg) {
          console.log(
            `[JobBot Poll] Update #${update.update_id}: ` +
            `chat=${msg.chat?.id} thread=${msg.message_thread_id ?? '(none)'} ` +
            `text="${(msg.text ?? '').slice(0, 50)}"`
          );
        } else if (update.callback_query) {
          console.log(
            `[JobBot Poll] Callback #${update.update_id}: data="${update.callback_query.data}"`
          );
        }

        await handleJobBotUpdate(update, config);
      }
    } catch (error: unknown) {
      const err = error as {
        name?: string;
        message?: string;
        cause?: { code?: string; message?: string };
        code?: string;
      };
      const isConnectTimeout =
        err?.name === 'AbortError' ||
        err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET' ||
        err?.message?.includes('fetch failed') ||
        err?.message?.includes('aborted');

      if (isConnectTimeout) {
        const detail = err?.cause?.message || err?.message || 'Connection timeout';
        console.warn(
          `[JobBot Poll] Gagal terhubung ke api.telegram.org (${detail}).\n` +
          `               Periksa koneksi internet, DNS, atau VPN. Retrying in 10s...`
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        console.error('[JobBot Poll] Error:', error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}

void main();


