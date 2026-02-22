import React from "react";
import type { AboutData } from "@/types/about";

interface PhilosophyTabProps {
    aboutData: AboutData | null | undefined;
}

export const PhilosophyTab = ({ aboutData }: PhilosophyTabProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">
                {aboutData?.designPhilosophy?.heading || "Design Philosophy"}
            </h1>
            <p className="text-gray-600 font-medium">
                {aboutData?.designPhilosophy?.subheading || "Creating meaningful experiences through thoughtful design"}
            </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {aboutData?.designPhilosophy?.steps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-orange-500 font-bold font-mono text-lg">{step.number}</span>
                        <h3 className="font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {step.desc}
                    </p>
                    <div className="text-xs text-gray-500 italic border-l-2 border-orange-200 pl-2">
                        &quot;{step.quote}&quot;
                    </div>
                </div>
            )) || (
                    <div className="text-gray-400 text-sm italic py-4">
                        Philosophy data is being loaded or is unavailable.
                    </div>
                )}
        </div>
    </div>
);
