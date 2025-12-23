'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import type { Project } from '@/types/projects';

type Props = {
  aboutData: AboutData | null;
  experienceData: ExperienceData | null;
  projects: Project[];
};

export default function CvPageClient({
  aboutData,
  experienceData,
  projects
}: Props) {
  const chunkWords = (text: string, size = 10) => {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += size) {
      chunks.push(words.slice(i, i + size).join(' '));
    }
    return chunks;
  };

  const displayName = 'Ramos';
  const headline = aboutData?.professional?.motto?.quote ?? 'Graphic Designer & Visual Storyteller';
  const summary = aboutData?.professional?.bio?.content ?? 'Desainer grafis dengan fokus pada visual bersih, tipografi kuat, dan storytelling.';
  const softSkills = aboutData?.softSkills?.texts ?? [];
  const hardSkills = [
    { tool: 'Adobe Photoshop', level: 'Expert' },
    { tool: 'Adobe Illustrator', level: 'Expert' },
    { tool: 'Figma', level: 'Expert' },
    { tool: 'Adobe Premiere Pro', level: 'Intermediate' },
    { tool: 'Adobe After Effects', level: 'Intermediate' }
  ];
  const workExperience = experienceData?.workExperience ?? [];
  const topProjects = useMemo(() => projects?.slice(0, 3) ?? [], [projects]);

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`
        @media print {
          body { background: white; }
        }
      `}</style>

      <div className="container max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">{displayName}</h1>
            <p className="text-lg text-gray-600">{headline}</p>
          </div>

        </div>

        <section className="border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Ringkasan</h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed mt-2">{summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-red-700 uppercase tracking-wide">Hard Skills</h2>
                {hardSkills.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {hardSkills.map(({ tool, level }) => (
                      <li key={tool} className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 flex items-center justify-between gap-3">
                        <span>{tool}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 border border-gray-300">
                          {level}
                        </span>
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
                  +{projects.length - 3} proyek lainnya, lihat <Link href="/work" className="text-blue-700 underline">/work</Link>.
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
  );
}
