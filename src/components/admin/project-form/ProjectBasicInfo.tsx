import { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectBasicInfoProps {
    formData: ProjectFormData;
    errors: Record<string, string>;
    updateField: (field: keyof ProjectFormData, value: any) => void;
}

export default function ProjectBasicInfo({ formData, errors, updateField }: ProjectBasicInfoProps) {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.title ? 'border-red-300 ring-red-200' : 'border-gray-300'
                            }`}
                        placeholder="Project title"
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                    </label>
                    <input
                        type="text"
                        value={formData.client}
                        onChange={(e) => updateField('client', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.client ? 'border-red-300' : 'border-gray-300'
                            }`}
                        placeholder="Client name"
                    />
                    {errors.client && (
                        <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year *
                    </label>
                    <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => updateField('year', parseInt(e.target.value) || new Date().getFullYear())}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.year ? 'border-red-300' : 'border-gray-300'
                            }`}
                        min="2000"
                        max={new Date().getFullYear() + 1}
                    />
                    {errors.year && (
                        <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => updateField('tags', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="React, Next.js, TypeScript (comma separated)"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                    placeholder="Project description"
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
            </div>
        </div>
    );
}
