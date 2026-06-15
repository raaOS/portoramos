/**
 * Project Narrative — Form narasi dan cerita di balik proyek.
 *
 * Menangani input deskripsi panjang, cerita proses, dan tantangan
 * yang dihadapi selama pengerjaan proyek.
 *
 * @module components/admin/project-form/ProjectNarrative
 */
import { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectNarrativeProps {
  formData: ProjectFormData;
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
}

export default function ProjectNarrative({ formData, updateField }: ProjectNarrativeProps) {
  const handleNarrativeChange = (field: keyof ProjectFormData['narrative'], value: string) => {
    updateField('narrative', {
      ...formData.narrative,
      [field]: value,
    });
  };

  const isVisualArt = formData.type === 'visual_art';
  const isCommercial = !isVisualArt;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isCommercial ? 'bg-purple-500' : 'bg-pink-500'}`}
          ></span>
          {isCommercial ? 'Narasi Komersial' : 'Konsep Artistik'}
        </h3>

        <div className="space-y-4">
          {/* Field 1: Context / Concept */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              {isCommercial ? 'Konteks / Tantangan' : 'Konsep / Filosofi'}
            </label>
            <p className="mb-2 text-[10px] text-gray-500">
              {isCommercial
                ? 'Apa masalah bisnisnya? Jelaskan "Kenapa" secara spesifik.'
                : 'Apa ide utamanya? Pesan apa yang ingin disampaikan?'}
            </p>
            <textarea
              value={isCommercial ? formData.narrative.challenge : formData.narrative.concept}
              onChange={(e) =>
                isCommercial
                  ? handleNarrativeChange('challenge', e.target.value)
                  : handleNarrativeChange('concept', e.target.value)
              }
              className="min-h-[80px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={
                isCommercial ? 'cth. Penjualan turun 20%...' : 'cth. Eksplorasi dualitas alam...'
              }
            />
          </div>

          {/* Field 2: Solution / Process */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              {isCommercial ? 'Solusi / Strategi' : 'Proses / Teknik'}
            </label>
            <p className="mb-2 text-[10px] text-gray-500">
              {isCommercial
                ? 'Bagaimana solusinya? (Design System, UX Research, dll)'
                : 'Bagaimana cara buatnya? (Tools, Teknik, Fotografi)'}
            </p>
            <textarea
              value={isCommercial ? formData.narrative.solution : formData.narrative.process}
              onChange={(e) =>
                isCommercial
                  ? handleNarrativeChange('solution', e.target.value)
                  : handleNarrativeChange('process', e.target.value)
              }
              className="min-h-[80px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={
                isCommercial
                  ? 'cth. Implementasi design system baru...'
                  : 'cth. Menggunakan frequency separation dan overlay 3D...'
              }
            />
          </div>

          {/* Field 3: Impact / Result */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              {isCommercial ? 'Dampak / Hasil' : 'Detail / Resepsi'}
            </label>
            <p className="mb-2 text-[10px] text-gray-500">
              {isCommercial
                ? 'Hasil terukur (CTR, Konversi, Feedback).'
                : 'Penghargaan, fitur, atau detail untuk diperhatikan.'}
            </p>
            <textarea
              value={isCommercial ? formData.narrative.impact : formData.narrative.detail}
              onChange={(e) =>
                isCommercial
                  ? handleNarrativeChange('impact', e.target.value)
                  : handleNarrativeChange('detail', e.target.value)
              }
              className="min-h-[60px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={
                isCommercial
                  ? 'cth. +40% Engagement user...'
                  : 'cth. Featured di Behance, Terbaik 2024...'
              }
            />
          </div>
        </div>
      </div>

      {/* Comparison Section moved to ProjectMediaUpload */}
    </div>
  );
}
