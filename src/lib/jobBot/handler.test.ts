import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleJobBotUpdate } from './handler';
import { sendJobBotMessage } from './sender';
import type { JobBotConfig } from './config';

vi.mock('./sender', () => ({
  answerJobBotCallback: vi.fn(),
  sendJobBotDocument: vi.fn(),
  sendJobBotMessage: vi.fn(),
}));

describe('handleJobBotUpdate command ownership', () => {
  const config: JobBotConfig = {
    botToken: 'job-token',
    adminChatId: 'admin-chat',
    threadId: 77,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('handles /scan only in the configured Job Hunter topic', async () => {
    await handleJobBotUpdate(
      {
        message: {
          text: '/scan',
          chat: { id: 'admin-chat' },
          message_thread_id: 77,
        },
      },
      config
    );

    expect(sendJobBotMessage).toHaveBeenCalledWith(
      'job-token',
      'admin-chat',
      '*Pilih sumber lowongan untuk di-scan:*',
      77,
      expect.objectContaining({
        inline_keyboard: expect.any(Array),
      })
    );
  });

  it('handles /cek as the only other Job Hunter command', async () => {
    await handleJobBotUpdate(
      {
        message: {
          text: '/cek',
          chat: { id: 'admin-chat' },
          message_thread_id: 77,
        },
      },
      config
    );

    expect(sendJobBotMessage).toHaveBeenCalledWith(
      'job-token',
      'admin-chat',
      expect.stringContaining('*Paste link loker di sini...*'),
      77,
      expect.objectContaining({
        force_reply: true,
      })
    );
  });

  it('ignores unknown commands', async () => {
    for (const text of ['/random', '/old']) {
      await handleJobBotUpdate(
        {
          message: {
            text,
            chat: { id: 'admin-chat' },
            message_thread_id: 77,
          },
        },
        config
      );
    }

    expect(sendJobBotMessage).not.toHaveBeenCalled();
  });

  it('ignores /scan and /cek outside the configured Job Hunter topic', async () => {
    for (const text of ['/scan', '/cek']) {
      await handleJobBotUpdate(
        {
          message: {
            text,
            chat: { id: 'admin-chat' },
            message_thread_id: 88,
          },
        },
        config
      );
    }

    expect(sendJobBotMessage).not.toHaveBeenCalled();
  });
});
