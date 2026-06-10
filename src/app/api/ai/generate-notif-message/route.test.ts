import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGeminiApiKeyMock, guardAdminAiRequestMock } = vi.hoisted(() => ({
  getGeminiApiKeyMock: vi.fn(),
  guardAdminAiRequestMock: vi.fn(),
}));

vi.mock('../_shared', () => ({
  getGeminiApiKey: getGeminiApiKeyMock,
  guardAdminAiRequest: guardAdminAiRequestMock,
}));

import { POST } from './route';

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/ai/generate-notif-message', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as never;
}

function geminiNotifResponse(message: string) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify({ message }) }],
          },
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

describe('POST /api/ai/generate-notif-message', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getGeminiApiKeyMock.mockReturnValue('test-key');
    guardAdminAiRequestMock.mockResolvedValue(null);
  });

  it('generates notification message from Gemini', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(geminiNotifResponse('Halo Ramos, ada project mobile app nih'));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Halo Ramos, ada project mobile app nih');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('gemini-flash-latest');
  });

  it('returns 400 when senderName is missing', async () => {
    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Sender name is required');
  });

  it('returns 500 when API key is not configured', async () => {
    getGeminiApiKeyMock.mockReturnValue('');

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('API Key not configured');
  });

  it('returns 500 when guard rejects', async () => {
    guardAdminAiRequestMock.mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when Gemini API responds with HTTP error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('Service unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Gemini API Error');
  });

  it('returns 500 when AI returns empty candidates', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ candidates: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('No response');
  });

  it('returns 500 when AI returns invalid JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'bukan json' }] } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('not valid JSON');
  });

  it('cleans markdown code fences from AI response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '```json\n{"message": "Halo bos!"}\n```' }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(request({ senderName: 'Budi' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Halo bos!');
  });
});
