import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateText, geminiModel, aiModel } from '@/lib/ai';
import * as geminiBridge from '@/lib/gemini';

describe('AI text generation wrapper (src/lib/ai.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Groq Provider', () => {
    it('generates text via Groq with valid model llama-3.3-70b-versatile', async () => {
      process.env.GROQ_API_KEY = 'mock-groq-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hasil dari Groq' } }],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await generateText('Halo testing Groq');
      expect(result).toBe('Hasil dari Groq');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer mock-groq-key');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('llama-3.3-70b-versatile');
    });

    it('tries next Groq model llama-3.1-8b-instant if first model returns error', async () => {
      process.env.GROQ_API_KEY = 'mock-groq-key';

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Hasil dari Groq model kedua' } }],
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const result = await generateText('Halo testing model kedua');
      expect(result).toBe('Hasil dari Groq model kedua');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const firstBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(firstBody.model).toBe('llama-3.3-70b-versatile');
      expect(secondBody.model).toBe('llama-3.1-8b-instant');
    });
  });

  describe('OpenRouter Provider', () => {
    it('falls back to OpenRouter when Groq is not configured', async () => {
      process.env.OPENROUTER_API_KEY = 'mock-openrouter-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hasil dari OpenRouter' } }],
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await generateText('Halo testing OpenRouter');
      expect(result).toBe('Hasil dari OpenRouter');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer mock-openrouter-key');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
    });

    it('falls back to OpenRouter when Groq fails all models', async () => {
      process.env.GROQ_API_KEY = 'mock-groq-key';
      process.env.OPENROUTER_API_KEY = 'mock-openrouter-key';

      const mockFetch = vi
        .fn()
        // Groq model 1 fail
        .mockResolvedValueOnce({ ok: false, status: 500 })
        // Groq model 2 fail
        .mockResolvedValueOnce({ ok: false, status: 500 })
        // OpenRouter model 1 success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Diselamatkan oleh OpenRouter' } }],
          }),
        });
      vi.stubGlobal('fetch', mockFetch);

      const result = await generateText('Halo testing fallback to OpenRouter');
      expect(result).toBe('Diselamatkan oleh OpenRouter');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling when all providers fail', () => {
    it('throws error when no provider keys are configured', async () => {
      await expect(generateText('Test tanpa provider')).rejects.toThrow(
        /AI generation failed: no provider available/
      );
    });

    it('throws error when all configured providers return failure', async () => {
      process.env.GROQ_API_KEY = 'mock-groq-key';
      process.env.OPENROUTER_API_KEY = 'mock-openrouter-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(generateText('Test kegagalan semua')).rejects.toThrow(
        /AI generation failed: no provider available/
      );
    });
  });

  describe('Backward Compatibility Bridge (src/lib/gemini.ts)', () => {
    it('re-exports generateText, geminiModel, and aiModel identically', () => {
      expect(geminiBridge.generateText).toBe(generateText);
      expect(geminiBridge.geminiModel).toBe(geminiModel);
      expect(geminiBridge.aiModel).toBe(aiModel);
    });
  });
});
