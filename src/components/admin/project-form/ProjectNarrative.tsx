import { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectNarrativeProps {
    formData: ProjectFormData;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectNarrative({ formData, updateField }: ProjectNarrativeProps) {
    const handleNarrativeChange = (field: keyof ProjectFormData['narrative'], value: string) => {
        updateField('narrative', {
            ...formData.narrative,
            [field]: value
        });
    };

    const handleComparisonChange = (field: 'beforeImage' | 'afterImage' | 'beforeType' | 'afterType', value: string) => {
        updateField('comparison', {
            ...formData.comparison,
            [field]: value
        });
    };

    const isCommercial = formData.type === 'commercial' || !formData.type;

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCommercial ? 'bg-purple-500' : 'bg-pink-500'}`}></span>
                    {isCommercial ? 'Commercial Narrative' : 'Artistic Concept'}
                </h3>

                <div className="space-y-4">
                    {/* Field 1: Context / Concept */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Context / Challenge' : 'Concept / Philosophy'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'What was the business problem? Be specific about the "Why".'
                                : 'What is the core idea? What message are you conveying?'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.challenge : formData.narrative.concept}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('challenge', e.target.value)
                                : handleNarrativeChange('concept', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
                            placeholder={isCommercial ? "e.g. Sales were down 20%..." : "e.g. Exploring the duality of nature..."}
                        />
                    </div>

                    {/* Field 2: Solution / Process */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Solution / Strategy' : 'Process / Technique'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'How did you solve it? (Design System, UX Research, etc.)'
                                : 'How was it made? (Tools, Blending Modes, Photography)'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.solution : formData.narrative.process}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('solution', e.target.value)
                                : handleNarrativeChange('process', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[80px]"
                            placeholder={isCommercial ? "e.g. Implemented a new design system..." : "e.g. Used frequency separation and 3D overlays..."}
                        />
                    </div>

                    {/* Field 3: Impact / Result */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {isCommercial ? 'Impact / Results' : 'Detail / Reception'}
                        </label>
                        <p className="text-[10px] text-gray-500 mb-2">
                            {isCommercial
                                ? 'Measurable outcomes (CTR, Conversion, Feedback).'
                                : 'Awards, features, or specific details to notice.'}
                        </p>
                        <textarea
                            value={isCommercial ? formData.narrative.impact : formData.narrative.result}
                            onChange={(e) => isCommercial
                                ? handleNarrativeChange('impact', e.target.value)
                                : handleNarrativeChange('result', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[60px]"
                            placeholder={isCommercial ? "e.g. +40% User Engagement" : "e.g. Featured on Behance, Best of 2024..."}
                        />
                    </div>
                </div>
            </div>

            {/* Before-After Comparison - Only for Visual Art */}
            {!isCommercial && (
                <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        Before-After Comparison
                    </h3>

                    <div className="space-y-4">
                        {/* Before Media */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Before / Raw Media
                                </label>
                                <select
                                    value={formData.comparison.beforeType}
                                    onChange={(e) => handleComparisonChange('beforeType', e.target.value as 'image' | 'video')}
                                    className="text-[10px] sm:text-xs border-gray-200 rounded-none focus:ring-orange-500 focus:border-orange-500 py-0.5 px-2"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                value={formData.comparison.beforeImage}
                                onChange={(e) => handleComparisonChange('beforeImage', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="https://..."
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Great for showing "Raw Photo" vs "Final Edit" or "Wireframe" vs "UI".
                            </p>
                        </div>

                        {/* After Media */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-gray-700">
                                    After / Final Media
                                </label>
                                <select
                                    value={formData.comparison.afterType}
                                    onChange={(e) => handleComparisonChange('afterType', e.target.value as 'image' | 'video')}
                                    className="text-[10px] sm:text-xs border-gray-200 rounded-none focus:ring-orange-500 focus:border-orange-500 py-0.5 px-2"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                value={formData.comparison.afterImage || (formData.cover === formData.comparison.afterImage ? '' : '')}
                                // Logic: if empty in JSON, it uses cover. User can explicit overwrite.
                                onChange={(e) => handleComparisonChange('afterImage', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="Leave empty to use Main Cover as 'After' image"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
