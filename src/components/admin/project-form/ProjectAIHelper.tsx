import { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

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
    narrative: any;
    // For Viral Package
    likes?: number;
    shares?: number;
    isViralPackageRequested?: boolean;
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

export default function ProjectAIHelper({ cover, pendingFile, slug, projectId, onGenerate }: ProjectAIHelperProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiOptions, setAiOptions] = useState({
        style: 'estetik & profesional',
        maxTitleWords: 5,
        sentenceCount: 2,
        viralPackage: true
    });
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!cover && !pendingFile) {
            setError("Upload media cover first!");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const body: GenerateRequestBody = {
                style: aiOptions.style,
                maxTitleWords: aiOptions.maxTitleWords,
                sentenceCount: aiOptions.sentenceCount
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
                    'X-CSRF-Token': getCsrfToken()
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                console.warn("AI text generation warning:", err);
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
                if (projectId) {
                    try {
                        await fetch('/api/admin/projects/magic-complete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-Token': getCsrfToken()
                            },
                            body: JSON.stringify({
                                projectId: projectId,
                                slug: slug || data.title?.toLowerCase().replace(/ /g, '-') || 'temp-slug'
                            })
                        });
                    } catch (magicErr) {
                        console.warn("Magic complete API failed silently.", magicErr);
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
                isViralPackageRequested: aiOptions.viralPackage
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
        <div className="bg-white border border-gray-200 rounded-none p-5 mb-6 shadow-sm relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-violet-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="flex flex-col gap-5 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-violet-100 p-1.5 rounded-sm">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-none mb-1">Magic AI Auto-Fill</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Biarkan AI yang bercerita</p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-violet-600 transition-colors">Include Viral Stats</span>
                        <div className="relative inline-flex items-center">
                            <input
                                type="checkbox"
                                className="opacity-0 absolute w-0 h-0 peer"
                                checked={aiOptions.viralPackage}
                                onChange={(e) => setAiOptions(prev => ({ ...prev, viralPackage: e.target.checked }))}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                        </div>
                    </label>
                </div>

                {/* Configurations */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tone of Voice</label>
                        <select
                            value={aiOptions.style}
                            onChange={(e) => setAiOptions(prev => ({ ...prev, style: e.target.value }))}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-none pl-3 pr-10 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all truncate hover:border-violet-300 cursor-pointer"
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
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate" title="Max Title Words">Max Words</label>
                        <input
                            type="number"
                            value={aiOptions.maxTitleWords}
                            onChange={(e) => setAiOptions(prev => ({ ...prev, maxTitleWords: parseInt(e.target.value) || 5 }))}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-none px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-center hover:border-violet-300"
                            min="1" max="15"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">Sentences</label>
                        <input
                            type="number"
                            value={aiOptions.sentenceCount}
                            onChange={(e) => setAiOptions(prev => ({ ...prev, sentenceCount: parseInt(e.target.value) || 2 }))}
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-none px-3 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all text-center hover:border-violet-300"
                            min="1" max="5"
                        />
                    </div>
                    <div className="col-span-1">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating || (!cover && !pendingFile)}
                            title="Auto-Fill Form with AI"
                            className="w-full h-[42px] flex items-center justify-center gap-2 text-white bg-violet-600 hover:bg-violet-700 rounded-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:bg-gray-400"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Wait</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Generate</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-2 text-xs font-bold text-red-500 bg-red-50 p-2 border border-red-100 flex items-center gap-2">
                        <span>⚠️ Error: {error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
