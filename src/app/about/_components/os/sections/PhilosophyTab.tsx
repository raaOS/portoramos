import React from "react";
import type { AboutData } from "@/types/about";

import { FlowchartProcess } from "@/components/ui/FlowchartProcess";

interface PhilosophyTabProps {
    aboutData: AboutData | null | undefined;
}

export const PhilosophyTab = ({ aboutData }: PhilosophyTabProps) => {
    const philosophy = aboutData?.designPhilosophy;
    
    // Defensive: cek workflowSteps ada dan valid
    const hasWorkflowSteps = philosophy?.workflowSteps 
        && Array.isArray(philosophy.workflowSteps)
        && philosophy.workflowSteps.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h1 className="text-2xl font-bold text-black mb-2 dark:text-white">
                    {philosophy?.heading || "Design Philosophy"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {philosophy?.subheading || "Strategic Thinking Framework"}
                </p>
            </div>

            <div className="w-full">
                {hasWorkflowSteps && philosophy ? (
                    <FlowchartProcess workflowSteps={philosophy.workflowSteps} />
                ) : (
                    <div className="text-gray-400 text-sm italic py-4">
                        Workflow data sedang dimuat atau tidak tersedia.
                    </div>
                )}
            </div>
        </div>
    );
};
