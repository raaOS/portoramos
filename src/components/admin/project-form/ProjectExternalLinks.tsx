import { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectExternalLinksProps {
    formData: ProjectFormData;
    updateField: (field: keyof ProjectFormData, value: any) => void;
}

export default function ProjectExternalLinks({ formData, updateField }: ProjectExternalLinksProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                External Link
            </label>
            <input
                type="text"
                value={formData.external_link}
                onChange={(e) => updateField('external_link', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="https://example.com"
            />
        </div>
    );
}
