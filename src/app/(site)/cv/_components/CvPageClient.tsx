'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import type { Project } from '@/types/projects';
import type { HardSkillsData } from '@/types/hardSkill';
import SystemNavFrame from '@/components/layout/SystemNavFrame';
import { Loader2 } from 'lucide-react';

// Extracted Sub-components & Hook
import { useCvExport } from './hooks/useCvExport';
import { 
    CvSection, 
    CvWebHeader, 
    CvPrintHeader, 
    CvSkills, 
    CvExperience 
} from './components/CvUIComponents';

type Props = {
  aboutData: AboutData | null;
  experienceData: ExperienceData | null;
  projects: Project[];
  hardSkillsData: HardSkillsData | null;
};

export default function CvPageClient({
  aboutData,
  experienceData,
  projects,
  hardSkillsData
}: Props) {
  const searchParams = useSearchParams();
  const shouldAutoPrint = searchParams?.get('print') === 'true';
  const cvRef = useRef<HTMLDivElement>(null);

  const displayName = 'Ramos';
  const headline = 'Graphic Designer';
  const summary = aboutData?.professional?.bio?.content ?? 'Desainer Grafis senior dengan fokus pada solusi visual yang strategis dan berdampak nyata.';
  
  const { handlePrint } = useCvExport({ cvRef, displayName });

  useEffect(() => {
    if (shouldAutoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPrint]);

  const chunkWords = (text: string, size = 10) => {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += size) {
      chunks.push(words.slice(i, i + size).join(' '));
    }
    return chunks;
  };

  const softSkills = aboutData?.softSkills?.texts ?? [];
  const hardSkills = useMemo(() => {
    const skills = hardSkillsData?.skills || [];
    return skills
      .filter(s => s.isActive !== false)
      .slice(0, 10)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(s => ({
        tool: s.name,
        level: s.level,
        details: s.details || []
      }));
  }, [hardSkillsData]);

  const workExperience = experienceData?.workExperience ?? [];

  return (
    <SystemNavFrame>
      <div className="min-h-screen bg-[#F0F0F0] text-gray-900 selection:bg-red-100 selection:text-red-900">
        <style>{`
          @media print {
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              background: white !important;
              margin: 15mm 20mm !important;
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .cv-container { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
            .cv-section { border-color: #eee !important; background: transparent !important; }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `}</style>

        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-8 cv-container">
          <CvWebHeader 
            displayName={displayName}
            headline={headline}
            onPrint={handlePrint}
          />

          <CvPrintHeader displayName={displayName} headline={headline} />

          <section 
            ref={cvRef}
            className="cv-section border-2 border-black/5 md:border-black/5 rounded-3xl p-6 md:p-10 shadow-xl bg-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none no-print" />

            <div className="space-y-10 relative z-10">
              <CvSection title="Ringkasan Profesional" accent>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed font-medium">{summary}</p>
              </CvSection>

              <CvSkills hardSkills={hardSkills} softSkills={softSkills} />

              <CvExperience workExperience={workExperience} chunkWords={chunkWords} />
            </div>
          </section>
        </div>
      </div>
    </SystemNavFrame>
  );
}
