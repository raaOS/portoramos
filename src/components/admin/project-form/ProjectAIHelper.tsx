import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

interface AIResponse {
    title: string;
    description: string;
    client: string;
    tags: string | string[];
    type: 'commercial' | 'visual_art';
    role: string;
    team: string;
    timeline: string;
    software?: string[];
    narrative: unknown;
}

interface ProjectAIHelperProps {
    cover: string;
    pendingFile: File | null;
    slug: string; // Used for context if needed
    onGenerate: (data: AIResponse) => void;
}

interface GenerateRequestBody {
    style: 'professional' | 'creative' | 'minimalist';
    maxTitleWords: number;
    sentenceCount: number;
    imageBase64?: string;
    imageUrl?: string;
}

export default function ProjectAIHelper({ cover, pendingFile, onGenerate }: ProjectAIHelperProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<'professional' | 'creative' | 'minimalist'>('professional');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!cover && !pendingFile) {
            setError("Upload media first!");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const body: GenerateRequestBody = {
                style: selectedStyle,
                maxTitleWords: 6,
                sentenceCount: 3
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

            const res = await fetch('/api/ai/generate-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'AI Generation Failed');
            }

            const data = await res.json();

            // Parse tags if string
            let tags = data.tags;
            if (typeof tags === 'string') {
                tags = tags.split(',').map((t: string) => t.trim());
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
                narrative: data.narrative || {}
            });

        } catch (err: unknown) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Failed to generate details";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 border border-violet-100 rounded-none mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-violet-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        AI Helper
                    </h3>
                    <p className="text-xs text-violet-600 mt-1">
                        Auto-fill title, description & tags from image.
                    </p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!cover && !pendingFile)}
                    className={`
                        flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white
                        bg-violet-600 hover:bg-violet-700 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-3 h-3" />
                            Auto-Generate
                        </>
                    )}
                </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-violet-400 mr-2">Tone:</span>
                {(['professional', 'creative', 'minimalist'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSelectedStyle(s)}
                        className={`
                            px-3 py-1 text-[10px] font-bold uppercase tracking-tighter transition-all
                            ${selectedStyle === s
                                ? 'bg-violet-600 text-white shadow-sm'
                                : 'bg-white text-violet-500 border border-violet-100 hover:bg-violet-50'}
                        `}
                    >
                        {s}
                    </button>
                ))}
            </div>
            {error && (
                <p className="text-xs text-red-500 mt-2 font-medium">
                    Error: {error}
                </p>
            )}
        </div>
    );
}
