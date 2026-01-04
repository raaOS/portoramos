import { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectNarrativeProps {
    formData: ProjectFormData;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectNarrative({ formData, updateField }: ProjectNarrativeProps) {
    const handleNarrativeChange = (field: 'challenge' | 'solution' | 'result', value: string) => {
        updateField('narrative', {
            ...formData.narrative,
            [field]: value
        });
    };

    const handleComparisonChange = (field: 'beforeImage' | 'afterImage', value: string) => {
        updateField('comparison', {
            ...formData.comparison,
            [field]: value
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    Creative Story (Optional)
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Challenge / Concept
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            For Client Work: What was the problem? For Personal Work: What was the idea?
                        </p>
                        <textarea
                            value={formData.narrative.challenge}
                            onChange={(e) => handleNarrativeChange('challenge', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[80px]"
                            placeholder="e.g. The client needed a logo that works in small sizes..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Solution / Technique
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            Tools used, approach taken, or technical breakdown.
                        </p>
                        <textarea
                            value={formData.narrative.solution}
                            onChange={(e) => handleNarrativeChange('solution', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[80px]"
                            placeholder="e.g. Used minimalist geometry and sans-serif typography..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Result / Impact (Optional)
                        </label>
                        <textarea
                            value={formData.narrative.result}
                            onChange={(e) => handleNarrativeChange('result', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[60px]"
                            placeholder="e.g. Increased brand recognition by 20%..."
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Before-After Comparison (Optional)
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Before Image URL
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            Upload the raw/original image here.
                        </p>
                        <input
                            type="text"
                            value={formData.comparison.beforeImage}
                            onChange={(e) => handleComparisonChange('beforeImage', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            After Image URL (Usually Cover)
                        </label>
                        <input
                            type="text"
                            value={formData.comparison.afterImage || formData.cover}
                            onChange={(e) => handleComparisonChange('afterImage', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            placeholder="Leave empty to use Cover Image automatically"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                            If left empty, the main Cover Image will be used as the "After" state.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
