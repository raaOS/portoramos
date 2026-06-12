/**
 * Job Bot Config — Konfigurasi dan credential untuk Job Hunter Bot.
 * @module lib/jobBot/config
 */
import crypto from 'crypto';
import { cleanEnvVar } from '@/lib/utils/env';

export interface JobBotConfig {
  botToken: string;
  adminChatId: string;
  threadId?: number;
}

export function getJobBotConfig(): JobBotConfig {
  const botToken = cleanEnvVar('JOB_BOT_TELEGRAM_TOKEN');
  const adminChatId = cleanEnvVar('JOB_BOT_ADMIN_CHAT_ID');
  const threadIdRaw = cleanEnvVar('JOB_BOT_THREAD_ID');
  const threadId = threadIdRaw ? Number.parseInt(threadIdRaw, 10) : NaN;

  if (!botToken || !/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
    throw new Error('JOB_BOT_TELEGRAM_TOKEN is missing or invalid');
  }

  if (!adminChatId) {
    throw new Error('JOB_BOT_ADMIN_CHAT_ID is missing');
  }

  return {
    botToken,
    adminChatId,
    threadId: Number.isFinite(threadId) ? threadId : undefined,
  };
}

export function buildJobBotWebhookSecret(botToken: string): string {
  return crypto.createHash('sha256').update(`job-telegram-webhook:${botToken}`).digest('hex');
}

export function isValidJobBotWebhookSecret(
  botToken: string,
  providedSecret?: string | null
): boolean {
  if (!providedSecret) return false;

  const expected = buildJobBotWebhookSecret(botToken);
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
