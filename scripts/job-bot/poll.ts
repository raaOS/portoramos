import dotenv from 'dotenv';
import { getJobBotConfig } from '../../src/lib/jobBot/config';
import { handleJobBotUpdate, type JobBotUpdate } from '../../src/lib/jobBot/handler';

dotenv.config({ path: '.env.local', quiet: true });

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

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?${params.toString()}`
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
        await handleJobBotUpdate(update, config);
      }
    } catch (error) {
      console.error('[JobBot Poll] Error:', error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

void main();
