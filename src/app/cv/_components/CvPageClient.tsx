'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import type { Project } from '@/types/projects';
import type { HardSkillsData } from '@/types/hardSkill';
import { useAnalytics } from '@/hooks/useAnalytics';
import SystemNavFrame from '@/components/layout/SystemNavFrame';
import { Download, FileText, Share2, Printer } from 'lucide-react';

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

  useEffect(() => {
    if (shouldAutoPrint) {
      // Small timeout to ensure DOM is fully ready
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

  const displayName = 'Ramos';
  const headline = 'Graphic Designer & Visual Strategist';
  const summary = aboutData?.professional?.bio?.content ?? 'Desainer Grafis senior dengan fokus pada solusi visual yang strategis dan berdampak nyata.';
  const contacts = (aboutData as any)?.professional?.contacts;

  const softSkills = aboutData?.softSkills?.texts ?? [];

  // Use dynamic hard skills if available, otherwise fallback (or empty)
  const hardSkills = useMemo(() => {
    const skills = hardSkillsData?.skills || [];
    return skills
      .filter(s => s.isActive !== false) // Filter active only
      .slice(0, 10) // Limit to top 10 to fit page
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(s => ({
        tool: s.name,
        level: s.level,
        details: s.details || [] // Fallback support for generic 'skills' field if used elsewhere
      }));
  }, [hardSkillsData]);

  const workExperience = experienceData?.workExperience ?? [];
  const topProjects = useMemo(() => projects?.slice(0, 3) ?? [], [projects]);

  const { trackEvent } = useAnalytics();

  const handlePrint = () => {
    trackEvent('CV_DOWNLOAD', { source: 'CvPage' });
    if (typeof window === 'undefined') return;
    window.print();
  };

  return (
    <SystemNavFrame>
      <div className="min-h-screen bg-[#F0F0F0] text-gray-900 selection:bg-red-100 selection:text-red-900">
        <style>{`
          @media print {
            body { background: white !important; }
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
          {/* Web Header: Premium & Immersive */}
          <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-black/5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100">
                <FileText size={12} /> Curriculum Vitae
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900">{displayName}</h1>
              <p className="text-xl md:text-2xl font-medium text-gray-500">{headline}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Download size={14} /> Download CV
              </button>
              <button className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Print-only Header (Standard ATS) */}
          <div className="print-only hidden pb-4 border-b border-gray-100">
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-lg text-gray-600">{headline}</p>
            <p className="text-sm mt-1">portofolio-ramos.vercel.app</p>
          </div>

          <section className="cv-section border-2 border-black/5 md:border-black/5 rounded-3xl p-6 md:p-10 shadow-xl bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none no-print" />

            <div className="space-y-10 relative z-10">
              <div>
                <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-red-600/20" /> Ringkasan Profesional
                </h2>
                <p className="text-base md:text-xl text-gray-800 leading-relaxed font-medium">{summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Hard Skills</h2>
                  {hardSkills.length > 0 ? (
                    <ul className="mt-2 space-y-2 text-sm">
                      {hardSkills.map(({ tool, level, details }) => (
                        <li key={tool} className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{tool}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 border border-gray-300">
                              {level}
                            </span>
                          </div>
                          {details && details.length > 0 && (
                            <div className="mt-1 text-xs text-gray-700 print:text-black">
                              {details.join(' • ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">Data hard skills belum tersedia.</p>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Soft Skills</h2>
                  {softSkills.length > 0 ? (
                    <ul className="mt-2 space-y-2 text-sm">
                      {softSkills.slice(0, 4).map((skill) => (
                        <li key={skill} className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 text-center">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">Data soft skills belum tersedia.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Experience</h2>
                {workExperience.length > 0 ? (
                  workExperience.map((exp, idx) => (
                    <div key={`${exp.company}-${idx}`} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-semibold text-gray-900">{exp.position} - {exp.company}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <span>{exp.year}</span>
                          {exp.duration && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                              {exp.duration}
                            </span>
                          )}
                        </div>
                      </div>
                      {exp.description?.length ? (
                        <div className="text-sm text-gray-700 mt-2 space-y-1">
                          {exp.description.slice(0, 4).map((item, dIdx) => (
                            <div key={dIdx} className="flex items-start gap-2">
                              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-700" />
                              <div className="space-y-1">
                                {chunkWords(item).map((chunk, cIdx) => (
                                  <div key={cIdx}>
                                    {chunk}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Data experience belum tersedia.</p>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Projects</h2>
                {topProjects.length > 0 ? (
                  <ul className="space-y-2">
                    {topProjects.map((project) => (
                      <li key={project.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{project.title}</span>
                          <span className="text-xs text-gray-600">{project.year || '—'}</span>
                        </div>
                        {project.description ? (
                          <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                        ) : null}
                        {project.tags?.length ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Belum ada proyek ditampilkan.</p>
                )}
                {projects.length > 3 && (
                  <p className="text-xs text-gray-600">
                    +{projects.length - 3} proyek lainnya, lihat <Link href="/" className="text-blue-700 underline">portfolio lengkap</Link>.
                  </p>
                )}

                <div className="pt-4 flex justify-end print:hidden">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download sekarang
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SystemNavFrame>
  );
}
