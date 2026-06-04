import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { getIconMap } from '@/constants/skillIcons';
import { getProxiedUrl } from '@/lib/utils';
import type { AboutData } from '@/types/about';
import type { HardSkillsData } from '@/types/hardSkill';

interface InterestsTabProps {
  aboutData: AboutData | null | undefined;
  hardSkillsData: HardSkillsData | null | undefined;
}

const hardSkillIconMap = getIconMap('h-5 w-5');

function getLocalHardSkillIcon(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes('photoshop')) return hardSkillIconMap.photoshop;
  if (normalizedName.includes('illustrator')) return hardSkillIconMap.illustrator;
  if (normalizedName.includes('figma')) return hardSkillIconMap.figma;
  if (normalizedName.includes('canva')) return hardSkillIconMap.canva;

  return null;
}

export const InterestsTab = ({ aboutData, hardSkillsData }: InterestsTabProps) => {
  // Normalize soft skills data
  const rawItems =
    aboutData?.softSkills?.items ||
    aboutData?.softSkills?.texts?.map((text, i) => ({
      text,
      description: aboutData?.softSkills?.descriptions?.[i] || '',
      isDraft: false,
    })) ||
    [];

  // Filter out drafts
  const softSkills = rawItems.filter((item) => !item.isDraft);
  const hardSkills = hardSkillsData?.skills?.filter((s) => s.isActive !== false) || [];

  if (softSkills.length === 0 && hardSkills.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 text-sm italic text-gray-400 duration-300">
        No skills to display.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-10 pb-10 duration-300">
      <div>
        <h1 className="mb-6 text-2xl font-bold text-black">Skillset</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          Kombinasi keahlian teknis dan interpersonal yang saya gunakan untuk membangun solusi
          berkualitas.
        </p>
      </div>

      {/* Hard Skills Section */}
      {hardSkills.length > 0 && (
        <div className="space-y-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Technical Stack
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {hardSkills.map((skill, idx) => (
              <div
                key={skill.id || idx}
                className="group flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-4 transition-all duration-300 hover:border-[#42b549]/20 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                    {getLocalHardSkillIcon(skill.name) || (
                      <Image
                        src={getProxiedUrl(skill.iconUrl)}
                        alt={skill.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{skill.name}</h3>
                </div>

                <div className="space-y-1.5">
                  {skill.details?.map((detail, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#42b549] bg-[#42b549]/10">
                        <Check size={8} className="text-[#42b549]" strokeWidth={3} />
                      </div>
                      <span className="text-xs leading-tight text-gray-600">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soft Skills Section */}
      {softSkills.length > 0 && (
        <div className="space-y-6 border-t border-gray-100 pt-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Interpersonal Skills
          </h2>
          <div className="space-y-8">
            {softSkills.map((item, idx) => (
              <div key={idx} className="group">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-black">
                  {item.text}
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
