'use client';

import React from 'react';
import { Link } from 'next-view-transitions';
import { Download, FileText, Printer, Loader2, Globe, CheckCircle2 } from 'lucide-react';
import type { Project } from '@/types/projects';
import type { WorkExperience } from '@/types/experience';
import type { HardSkillLevel } from '@/types/hardSkill';

interface SectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    accent?: boolean;
}

export const CvSection = ({ title, children, className = "", accent = false }: SectionProps) => (
    <div className={className}>
        <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${accent ? 'text-red-700' : 'text-gray-800'}`}>
            {title}
        </h2>
        {children}
    </div>
);

interface CvWebHeaderProps {
    displayName: string;
    headline: string;
    onPrint: () => void;
}

interface CvSkillItem {
    tool: string;
    level: HardSkillLevel;
    details: string[];
}

export const CvWebHeader = ({ displayName, headline, onPrint }: CvWebHeaderProps) => (
    <div className="no-print flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-black/5">
        <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-red-100">
                <FileText size={12} /> Curriculum Vitae
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900">{displayName}</h1>
            <div className="flex flex-col gap-4">
                <p className="text-xl md:text-2xl font-medium text-gray-500">{headline}</p>
                <a 
                    href="https://ramos-portofolio.vercel.app/" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md text-sm font-medium border border-gray-200 no-underline shadow-sm hover:bg-gray-200 transition-colors w-fit"
                >
                    <Globe size={14} className="text-gray-500" />
                    ramos-portofolio.vercel.app
                </a>
            </div>
        </div>

        <div className="flex gap-3">
            <button
                onClick={onPrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
                <Printer size={14} /> 
                Cetak / Simpan PDF
            </button>
        </div>
    </div>
);

export const CvPrintHeader = ({ displayName, headline }: { displayName: string, headline: string }) => (
    <div className="print-only hidden pb-4">
        <h1 className="text-3xl font-bold">{displayName}</h1>
        <p className="text-lg text-gray-600 mb-3">{headline}</p>
        <a 
            href="https://ramos-portofolio.vercel.app/" 
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 text-gray-800 rounded-md text-sm font-medium border border-gray-200 no-underline shadow-sm"
        >
            <Globe size={14} className="text-gray-500" />
            ramos-portofolio.vercel.app
        </a>
    </div>
);

export const CvSkills = ({ hardSkills, softSkills }: { hardSkills: CvSkillItem[], softSkills: string[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
        <CvSection title="Hard Skills">
            {hardSkills.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm">
                    {hardSkills.map(({ tool, level, details }) => (
                        <li key={tool} className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                            <div className="flex items-center justify-between gap-3 mb-1">
                                <span className="text-sm font-semibold text-gray-900">{tool}</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200">
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
        </CvSection>
        <CvSection title="Soft Skills">
            {softSkills.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm">
                    {softSkills.slice(0, 4).map((skill) => (
                        <li key={skill} className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium text-gray-800">
                            {skill}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-600 mt-2">Data soft skills belum tersedia.</p>
            )}
        </CvSection>
    </div>
);

export const CvExperience = ({ workExperience, chunkWords }: { workExperience: WorkExperience[], chunkWords: (t: string) => string[] }) => (
    <CvSection title="Experience" className="print:break-before-page">
        {workExperience.length > 0 ? (
            workExperience.map((exp, idx) => (
                <div key={`${exp.company}-${idx}`} className="border border-gray-100 rounded-lg p-3 mb-3 last:mb-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <div className="text-base font-semibold text-gray-900">{exp.position} - {exp.company}</div>
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
                            {exp.description.slice(0, 4).map((item: string, dIdx: number) => (
                                <div key={dIdx} className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="mt-0.5 text-gray-400 shrink-0" />
                                    <div className="space-y-1">
                                        {chunkWords(item).map((chunk: string, cIdx: number) => (
                                            <div key={cIdx}>{chunk}</div>
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
    </CvSection>
);

export const CvProjects = ({ topProjects, totalProjects }: { topProjects: Project[], totalProjects: number }) => (
    <CvSection title="Projects">
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

    </CvSection>
);
