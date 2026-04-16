import React from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import { getProxiedUrl } from "@/lib/utils";
import type { AboutData } from "@/types/about";
import type { HardSkillsData } from "@/types/hardSkill";

interface AboutTabProps {
    aboutData: AboutData | null | undefined;
    hardSkillsData: HardSkillsData | null | undefined;
}

export const AboutTab = ({ aboutData, hardSkillsData }: AboutTabProps) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div>
            <h1 className="text-2xl font-bold text-black mb-2">
                {aboutData?.hero.title || "Fullstack Developer"}
            </h1>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                {aboutData?.professional.bio.content || "Loading..."}
            </p>
        </div>

        {/* Hard Skills moved to Skillset tab */}
    </div>
);
