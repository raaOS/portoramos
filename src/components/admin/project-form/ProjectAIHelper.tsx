/**
 * Project AI Helper — Asisten AI untuk mengisi data proyek.
 *
 * Menggunakan Gemini API untuk menghasilkan deskripsi, caption, dan
 * komentar AI secara otomatis berdasarkan metadata proyek.
 *
 * @module components/admin/project-form/ProjectAIHelper
 */
import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Comment } from '@/lib/magic';

const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

export interface AIResponse {
  title: string;
  description: string;
  client: string;
  tags: string[];
  type: 'commercial' | 'visual_art';
  role: string;
  team: string;
  timeline: string;
  software?: string[];
  narrative: Record<string, unknown>;
  // For Viral Package
  likes?: number;
  shares?: number;
  isViralPackageRequested?: boolean;
  comments?: Comment[];
}

interface ProjectAIHelperProps {
  cover: string;
  pendingFile: File | null;
  slug: string; // Used for context if needed
  projectId?: string; // Used for magic-complete API if exists
  onGenerate: (data: AIResponse) => void;
}

interface GenerateRequestBody {
  style: string;
  maxTitleWords: number;
  sentenceCount: number;
  imageBase64?: string;
  imageUrl?: string;
}

export default function ProjectAIHelper({
  cover,
  pendingFile,
  slug,
  projectId: _projectId,
  onGenerate,
}: ProjectAIHelperProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState({
    style: 'estetik & profesional',
    maxTitleWords: 5,
    sentenceCount: 2,
    viralPackage: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!cover && !pendingFile) {
      setError('Upload media cover first!');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const body: GenerateRequestBody = {
        style: aiOptions.style,
        maxTitleWords: aiOptions.maxTitleWords,
        sentenceCount: aiOptions.sentenceCount,
      };

      if (pendingFile) {
        // Client-side file (Deferred Upload)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pendingFile);
        });
        body.imageBase64 = base64;
      } else {
        // Existing URL (Remote or Local)
        body.imageUrl = cover;
      }

      // 1. Generate text metadata
      const res = await fetch('/api/ai/generate-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn('AI text generation warning:', err);
        throw new Error(err.error || 'AI Generation Failed');
      }

      const data = await res.json();

      // Parse tags if string
      let tags = data.tags;
      if (typeof tags === 'string') {
        tags = tags.split(',').map((t: string) => t.trim());
      }

      // 2. Viral Package Magic
      let likesCount = undefined;
      let sharesCount = undefined;
      if (aiOptions.viralPackage) {
        if (_projectId) {
          try {
            await fetch('/api/admin/projects/magic-complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken(),
              },
              body: JSON.stringify({
                projectId: _projectId,
                slug: slug || data.title?.toLowerCase().replace(/ /g, '-') || 'temp-slug',
              }),
            });
          } catch (magicErr) {
            console.warn('Magic complete API failed silently.', magicErr);
          }
        }
        likesCount = Math.floor(Math.random() * 401) + 100;
        sharesCount = Math.floor(Math.random() * 81) + 20;
      }

      onGenerate({
        title: data.title,
        description: data.description,
        client: data.client,
        tags: Array.isArray(tags) ? tags : [],
        type: data.type || 'visual_art',
        role: data.role || '',
        team: data.team || '',
        timeline: data.timeline || '',
        software: data.software || [],
        narrative: data.narrative || {},
        likes: likesCount,
        shares: sharesCount,
        isViralPackageRequested: aiOptions.viralPackage,
      });
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate details';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white p-5">
      {/* Background design elements */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-100 opacity-50 blur-3xl"></div>

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-violet-100 p-1.5">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="mb-1 font-bold leading-none text-gray-900">Magic AI Auto-Fill</h3>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Biarkan AI yang bercerita
              </p>
            </div>
          </div>
          <label className="group flex cursor-pointer items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors group-hover:text-violet-600">
              Include Viral Stats
            </span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="peer absolute h-0 w-0 opacity-0"
                checked={aiOptions.viralPackage}
                onChange={(e) =>
                  setAiOptions((prev) => ({ ...prev, viralPackage: e.target.checked }))
                }
              />
              <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            </div>
          </label>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Tone of Voice
            </label>
            <select
              value={aiOptions.style}
              onChange={(e) => setAiOptions((prev) => ({ ...prev, style: e.target.value }))}
              className="w-full cursor-pointer truncate rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-10 text-sm outline-none transition-all hover:border-violet-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="estetik & profesional">Estetik & Profesional</option>
              <option value="minimalis & elegan">Minimalis & Elegan</option>
              <option value="kreatif & berapi-api">Kreatif & Berapi-api</option>
              <option value="poetis & mendalam">Poetis & Mendalam</option>
              <option value="santai & trendi">Santai & Trendi</option>
              <option value="Gen-Z (Casual/Chill)">Gen-Z (Casual/Chill)</option>
            </select>
          </div>
          <div className="col-span-1">
            <label
              className="mb-1 block truncate text-[10px] font-bold uppercase tracking-wider text-gray-400"
              title="Max Title Words"
            >
              Max Words
            </label>
            <input
              type="number"
              value={aiOptions.maxTitleWords}
              onChange={(e) =>
                setAiOptions((prev) => ({ ...prev, maxTitleWords: parseInt(e.target.value) || 5 }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-sm outline-none transition-all hover:border-violet-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              min="1"
              max="15"
            />
          </div>
          <div className="col-span-1">
            <label className="mb-1 block truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Sentences
            </label>
            <input
              type="number"
              value={aiOptions.sentenceCount}
              onChange={(e) =>
                setAiOptions((prev) => ({ ...prev, sentenceCount: parseInt(e.target.value) || 2 }))
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-sm outline-none transition-all hover:border-violet-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              min="1"
              max="5"
            />
          </div>
          <div className="col-span-1">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (!cover && !pendingFile)}
              title="Auto-Fill Form with AI"
              className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-white transition-all hover:bg-violet-700 active:scale-95 disabled:pointer-events-none disabled:bg-gray-400 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Wait</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-2 text-xs font-bold text-red-500">
            <span>⚠️ Error: {error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
