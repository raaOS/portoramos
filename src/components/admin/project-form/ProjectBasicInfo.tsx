import { useState, useMemo } from 'react';
import { ProjectFormData } from '@/hooks/useProjectForm';
import { X, Plus } from 'lucide-react';
import { Project } from '@/types/projects';
import { Label } from '@/types/labels';

interface ProjectBasicInfoProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
    allProjects?: Project[];
    labels?: Label[];
}

export default function ProjectBasicInfo({ formData, errors, updateField, allProjects = [], labels = [] }: ProjectBasicInfoProps) {
    const [tagInput, setTagInput] = useState('');

    // Official labels from managed database
    const officialLabels = useMemo(() => {
        const currentTags = formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
        return labels.filter(l => !currentTags.includes(l.name.toLowerCase()));
    }, [labels, formData.tags]);

    // Calculate unique existing tags from all projects that ARE NOT official labels
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        const officialNames = new Set(labels.map(l => l.name.toLowerCase()));

        allProjects.forEach(p => {
            if (p.tags) {
                p.tags.forEach(t => {
                    const cleanT = t.trim();
                    if (!officialNames.has(cleanT.toLowerCase())) {
                        tags.add(cleanT);
                    }
                });
            }
        });
        
        // Remove currently selected tags from the suggestion list
        const currentTags = formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
        currentTags.forEach(t => {
            // Case insensitive removal
            for (const existing of tags) {
                if (existing.toLowerCase() === t) tags.delete(existing);
            }
        });
        return Array.from(tags).sort();
    }, [allProjects, labels, formData.tags]);

    const currentTagsList = useMemo(() => {
        return formData.tags.split(',').map(t => t.trim()).filter(t => t);
    }, [formData.tags]);

    const handleAddTag = (tag: string) => {
        const cleanTag = tag.trim();
        if (!cleanTag) return;

        const current = new Set(formData.tags.split(',').map(t => t.trim()).filter(t => t));
        // Check case-insensitive existence
        const exists = Array.from(current).some(t => t.toLowerCase() === cleanTag.toLowerCase());

        if (!exists) {
            current.add(cleanTag);
            updateField('tags', Array.from(current).join(', '));
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const current = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        const filtered = current.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase());
        updateField('tags', filtered.join(', '));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tagInput);
        } else if (e.key === 'Backspace' && tagInput === '' && currentTagsList.length > 0) {
            e.preventDefault();
            const newTags = [...currentTagsList];
            newTags.pop();
            updateField('tags', newTags.join(', '));
        }
    };

    return (
        <div className="space-y-8">

            <div className="grid grid-cols-1 gap-6">
                {/* Basic Details Section */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${errors.title ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
                        placeholder="e.g. Neon Cyberpunk City"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600 font-medium">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Client Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.client}
                            onChange={(e) => updateField('client', e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${errors.client ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
                            placeholder="e.g. Personal Work"
                        />
                        {errors.client && <p className="mt-1 text-sm text-red-600 font-medium">{errors.client}</p>}
                    </div>

                    {/* Year Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Year <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    updateField('year', 0);
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num)) updateField('year', num);
                                }
                            }}
                            className={`w-full px-4 py-2.5 border rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${errors.year ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
                            min="2000"
                            max={new Date().getFullYear() + 1}
                        />
                        {errors.year && <p className="mt-1 text-sm text-red-600 font-medium">{errors.year}</p>}
                    </div>
                </div>

                {/* Engagement Settings Section - Moved Up */}
                <div className="bg-gray-50 p-4 border border-gray-100 rounded-none">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-none"></span>
                        Engagement Settings
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Likes Count
                            </label>
                            <input
                                type="number"
                                value={formData.likes}
                                onChange={(e) => updateField('likes', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono text-sm"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Shares Count
                            </label>
                            <input
                                type="number"
                                value={formData.shares}
                                onChange={(e) => updateField('shares', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono text-sm"
                                min="0"
                            />
                        </div>

                        {/* Initial / Add Comment Count */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                {formData.id ? 'Add More Comments' : 'Initial Comments'}
                            </label>
                            <input
                                type="number"
                                value={formData.initialCommentCount ?? (formData.id ? 0 : 2)}
                                onChange={(e) => updateField('initialCommentCount', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-blue-200 rounded-none bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-blue-700"
                                min="0"
                                max="10"
                                placeholder={formData.id ? "0" : "2"}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-end">
                        <label className="flex items-center gap-3 cursor-pointer group w-full p-2 h-[38px] hover:bg-gray-100 rounded-none transition-colors border border-transparent hover:border-gray-200">
                            <div className="relative inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.allowComments !== false} // Default true
                                    onChange={(e) => updateField('allowComments', e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600">
                                Allow Comments
                            </span>
                        </label>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Tags
                    </label>
                    {/* New Tag Selector UI */}
                    <div className="space-y-3">
                        {/* Selected Tags */}
                        <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border border-gray-300 rounded-none bg-white focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all">
                            {currentTagsList.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-medium bg-violet-100 text-violet-700 group">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:bg-violet-200 rounded-none p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                                className="flex-1 min-w-[100px] outline-none border-none focus:outline-none focus:ring-0 text-sm bg-transparent"
                                placeholder={currentTagsList.length === 0 ? "Type tag & Enter..." : ""}
                            />
                        </div>

                        {/* Official Labels Section */}
                        {officialLabels.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Managed Labels (Recommended)</p>
                                <div className="flex flex-wrap gap-2">
                                    {officialLabels.map((label, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddTag(label.name)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition-all group"
                                        >
                                            <div 
                                                className="w-1.5 h-1.5 rounded-full" 
                                                style={{ backgroundColor: label.color || '#8b5cf6' }}
                                            />
                                            <Plus className="w-3 h-3 text-violet-400 group-hover:scale-110 transition-transform" />
                                            {label.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestion / Tag Bank */}
                        {availableTags.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Other Recent Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.slice(0, 10).map((tag, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAddTag(tag)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                        >
                                            <Plus className="w-3 h-3 text-gray-400" />
                                            {tag}
                                        </button>
                                    ))}
                                    {availableTags.length > 10 && (
                                        <span className="text-[10px] text-gray-400 self-center">+{availableTags.length - 10} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none ${errors.description ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
                        placeholder="Describe the project concept, tools used, and outcome..."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600 font-medium">{errors.description}</p>}
                </div>

                {/* Optional Details: Role, Timeline, Team - Moved to Bottom */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                    {/* Role Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Role (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.role || ''}
                            onChange={(e) => updateField('role', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            placeholder="e.g. Lead Designer"
                        />
                    </div>
                    {/* Timeline Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Timeline (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.timeline || ''}
                            onChange={(e) => updateField('timeline', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            placeholder="e.g. 2 Weeks"
                        />
                    </div>
                    {/* Team Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Team (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.team || ''}
                            onChange={(e) => updateField('team', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-none bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            placeholder="e.g. Solo, Marketing Team"
                        />
                    </div>
                </div>

                {/* Software / Tools Selection (New) */}
                <div className="pt-6 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Software / Tools Used
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {['photoshop', 'illustrator', 'figma', 'capcut', 'affinity_designer', 'affinity_photo', 'premiere', 'aftereffects'].map(tool => {
                            const isSelected = formData.software?.includes(tool);
                            return (
                                <button
                                    key={tool}
                                    type="button"
                                    onClick={() => {
                                        const current = formData.software || [];
                                        if (current.includes(tool)) {
                                            updateField('software', current.filter(t => t !== tool));
                                        } else {
                                            updateField('software', [...current, tool]);
                                        }
                                    }}
                                    className={`px-3 py-1.5 text-xs font-bold transition-all border rounded-none uppercase flex items-center gap-2 ${isSelected
                                        ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
                                        }`}
                                >
                                    {tool.replace('_', ' ')}
                                    {isSelected && <X className="w-3 h-3" />}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-gray-500 italic">
                        Select tool icons to display in the project metadata section.
                    </p>
                </div>
            </div>
        </div>
    );
}
