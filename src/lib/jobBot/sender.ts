export async function sendJobBotMessage(
  botToken: string,
  chatId: string,
  text: string,
  threadId?: number,
  replyMarkup?:
    | {
        inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
      }
    | {
        force_reply: true;
        input_field_placeholder?: string;
        selective?: boolean;
      }
): Promise<Response> {
  const body: {
    chat_id: string;
    text: string;
    message_thread_id?: number;
    reply_markup?: typeof replyMarkup;
  } = {
    chat_id: chatId,
    text,
  };

  if (typeof threadId === 'number') {
    body.message_thread_id = threadId;
  }

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { description?: string } | null;
    console.error('[JobBot Sender] Send failed:', error?.description || response.statusText);
  }

  return response;
}

export async function answerJobBotCallback(
  botToken: string,
  callbackQueryId: string,
  text?: string
): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

export async function sendJobBotDocument(
  botToken: string,
  chatId: string,
  fileName: string,
  buffer: Buffer,
  caption: string,
  threadId?: number
): Promise<Response> {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append(
    'document',
    new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }),
    fileName
  );
  formData.append('caption', caption);
  formData.append('parse_mode', 'Markdown');

  if (typeof threadId === 'number') {
    formData.append('message_thread_id', String(threadId));
  }

  return fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData,
  });
}
