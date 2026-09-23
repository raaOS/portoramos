export interface InstagramExtractResult {
  url: string;
  shortcode: string;
  mediaType: 'post' | 'reel' | 'tv';
  caption: string;
  ocrText: string;
  thumbnailUrl?: string;
  sourceText: string;
}

export interface ParsedInstagramUrl {
  shortcode: string;
  mediaType: 'post' | 'reel' | 'tv';
  canonicalUrl: string;
}

export interface InstagramMeta {
  title?: string;
  description?: string;
  image?: string;
}
