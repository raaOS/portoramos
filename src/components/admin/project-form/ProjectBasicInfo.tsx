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

export default function ProjectBasicInfo({
  formData,
  errors,
  updateField,
  allProjects = [],
  labels = [],
}: ProjectBasicInfoProps) {
  const [tagInput, setTagInput] = useState('');

  // Official labels from managed database
  const officialLabels = useMemo(() => {
    const currentTags = formData.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t);
    return labels.filter((l) => !currentTags.includes(l.name.toLowerCase()));
  }, [labels, formData.tags]);

  // Calculate unique existing tags from all projects that ARE NOT official labels
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    const officialNames = new Set(labels.map((l) => l.name.toLowerCase()));

    allProjects.forEach((p) => {
      if (p.tags) {
        p.tags.forEach((t) => {
          const cleanT = t.trim();
          if (!officialNames.has(cleanT.toLowerCase())) {
            tags.add(cleanT);
          }
        });
      }
    });

    // Remove currently selected tags from the suggestion list
    const currentTags = formData.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t);
    currentTags.forEach((t) => {
      // Case insensitive removal
      for (const existing of tags) {
        if (existing.toLowerCase() === t) tags.delete(existing);
      }
    });
    return Array.from(tags).sort();
  }, [allProjects, labels, formData.tags]);

  const currentTagsList = useMemo(() => {
    return formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
  }, [formData.tags]);

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;

    const current = new Set(
      formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)
    );
    // Check case-insensitive existence
    const exists = Array.from(current).some((t) => t.toLowerCase() === cleanTag.toLowerCase());

    if (!exists) {
      current.add(cleanTag);
      updateField('tags', Array.from(current).join(', '));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const current = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);
    const filtered = current.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
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
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            className={`w-full rounded-none border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.title ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
            placeholder="e.g. Neon Cyberpunk City"
          />
          {errors.title && <p className="mt-1 text-sm font-medium text-red-600">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Client Name Input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => updateField('client', e.target.value)}
              className={`w-full rounded-none border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.client ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
              placeholder="e.g. Personal Work"
            />
            {errors.client && (
              <p className="mt-1 text-sm font-medium text-red-600">{errors.client}</p>
            )}
          </div>

          {/* Year Input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
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
              className={`w-full rounded-none border bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.year ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
              min="2000"
              max={new Date().getFullYear() + 1}
            />
            {errors.year && <p className="mt-1 text-sm font-medium text-red-600">{errors.year}</p>}
          </div>
        </div>

        {/* Engagement Settings Section - Moved Up */}
        <div className="rounded-none border border-gray-100 bg-gray-50 p-4">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className="h-1.5 w-1.5 rounded-none bg-violet-500"></span>
            Engagement Settings
          </h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Likes Count
              </label>
              <input
                type="number"
                value={formData.likes}
                onChange={(e) => updateField('likes', parseInt(e.target.value) || 0)}
                className="w-full rounded-none border border-gray-200 bg-white px-3 py-2 font-mono text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Shares Count
              </label>
              <input
                type="number"
                value={formData.shares}
                onChange={(e) => updateField('shares', parseInt(e.target.value) || 0)}
                className="w-full rounded-none border border-gray-200 bg-white px-3 py-2 font-mono text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                min="0"
              />
            </div>

            {/* Initial / Add Comment Count */}
            <div>
              <label className="mb-1 block flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {formData.id ? 'Add More Comments' : 'Initial Comments'}
              </label>
              <input
                type="number"
                value={formData.initialCommentCount ?? (formData.id ? 0 : 2)}
                onChange={(e) => updateField('initialCommentCount', parseInt(e.target.value) || 0)}
                className="w-full rounded-none border border-blue-200 bg-blue-50 px-3 py-2 font-mono text-blue-700 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="10"
                placeholder={formData.id ? '0' : '2'}
              />
            </div>
          </div>

          <div className="mt-4 flex items-end">
            <label className="group flex h-[38px] w-full cursor-pointer items-center gap-3 rounded-none border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-100">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.allowComments !== false} // Default true
                  onChange={(e) => updateField('allowComments', e.target.checked)}
                />
                <div className="peer h-5 w-9 rounded-none bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-none after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600">
                Allow Comments
              </span>
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tags</label>
          {/* New Tag Selector UI */}
          <div className="space-y-3">
            {/* Selected Tags */}
            <div className="flex min-h-[38px] flex-wrap gap-2 rounded-none border border-gray-300 bg-white p-2 transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-violet-500">
              {currentTagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="group inline-flex items-center gap-1 rounded-none bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-none p-0.5 transition-colors hover:bg-violet-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none focus:outline-none focus:ring-0"
                placeholder={currentTagsList.length === 0 ? 'Type tag & Enter...' : ''}
              />
            </div>

            {/* Official Labels Section */}
            {officialLabels.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  Managed Labels (Recommended)
                </p>
                <div className="flex flex-wrap gap-2">
                  {officialLabels.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddTag(label.name)}
                      className="group inline-flex items-center gap-1.5 rounded-none border border-violet-200 px-2.5 py-1 text-xs text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-50"
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: label.color || '#8b5cf6' }}
                      />
                      <Plus className="h-3 w-3 text-violet-400 transition-transform group-hover:scale-110" />
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestion / Tag Bank */}
            {availableTags.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Other Recent Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="inline-flex items-center gap-1 rounded-none border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3 text-gray-400" />
                      {tag}
                    </button>
                  ))}
                  {availableTags.length > 10 && (
                    <span className="self-center text-[10px] text-gray-400">
                      +{availableTags.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            className={`w-full resize-none rounded-none border bg-white px-4 py-3 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}`}
            placeholder="Describe the project concept, tools used, and outcome..."
          />
          {errors.description && (
            <p className="mt-1 text-sm font-medium text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Optional Details: Role, Timeline, Team - Moved to Bottom */}
        <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-4 sm:grid-cols-3">
          {/* Role Input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Role (Optional)
            </label>
            <input
              type="text"
              value={formData.role || ''}
              onChange={(e) => updateField('role', e.target.value)}
              className="w-full rounded-none border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Lead Designer"
            />
          </div>
          {/* Timeline Input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Timeline (Optional)
            </label>
            <input
              type="text"
              value={formData.timeline || ''}
              onChange={(e) => updateField('timeline', e.target.value)}
              className="w-full rounded-none border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. 2 Weeks"
            />
          </div>
          {/* Team Input */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Team (Optional)
            </label>
            <input
              type="text"
              value={formData.team || ''}
              onChange={(e) => updateField('team', e.target.value)}
              className="w-full rounded-none border border-gray-300 bg-white px-4 py-2.5 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Solo, Marketing Team"
            />
          </div>
        </div>

        {/* Software / Tools Selection (New) */}
        <div className="border-t border-gray-100 pt-6">
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            Software / Tools Used
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              'photoshop',
              'illustrator',
              'figma',
              'capcut',
              'affinity_designer',
              'affinity_photo',
              'premiere',
              'aftereffects',
            ].map((tool) => {
              const isSelected = formData.software?.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => {
                    const current = formData.software || [];
                    if (current.includes(tool)) {
                      updateField(
                        'software',
                        current.filter((t) => t !== tool)
                      );
                    } else {
                      updateField('software', [...current, tool]);
                    }
                  }}
                  className={`flex items-center gap-2 rounded-none border px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                    isSelected
                      ? 'border-violet-600 bg-violet-600 text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'
                  }`}
                >
                  {tool.replace('_', ' ')}
                  {isSelected && <X className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] italic text-gray-500">
            Select tool icons to display in the project metadata section.
          </p>
        </div>
      </div>
    </div>
  );
}
