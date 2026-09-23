import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';

describe('GET /api/music/search', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when query parameter q is missing', async () => {
    const request = new Request('http://localhost/api/music/search');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing query parameter q');
  });

  it('extracts nested multiline ytInitialData accurately without cutting off JSON', async () => {
    const mockYtHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          var ytInitialData = {
            "responseContext": {
              "serviceTrackingParams": [{"key": "service", "value": "CSI"}]
            },
            "contents": {
              "twoColumnSearchResultsRenderer": {
                "primaryContents": {
                  "sectionListRenderer": {
                    "contents": [
                      {
                        "itemSectionRenderer": {
                          "contents": [
                            {
                              "videoRenderer": {
                                "videoId": "abc123xyz",
                                "title": {
                                  "runs": [{"text": "Test Song"}]
                                },
                                "ownerText": {
                                  "runs": [{"text": "Test Artist"}]
                                },
                                "lengthText": {
                                  "simpleText": "3:45"
                                },
                                "thumbnail": {
                                  "thumbnails": [{"url": "https://example.com/thumb.jpg"}]
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          };
        </script>
      </head>
      <body></body>
      </html>
    `;

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(mockYtHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    );

    const request = new Request('http://localhost/api/music/search?q=test');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toEqual({
      id: 'abc123xyz',
      title: 'Test Song',
      artist: 'Test Artist',
      duration: 225,
      src: 'youtube',
      source: 'youtube',
      thumbnail: 'https://example.com/thumb.jpg',
    });
  });

  it('returns empty results array gracefully when ytInitialData is absent', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('<html><body>No data</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    );

    const request = new Request('http://localhost/api/music/search?q=unknown');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
  });
});
