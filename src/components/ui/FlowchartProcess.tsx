'use client';

import React from 'react';
import { RotateCcw, Circle, Sparkles, Search, Lightbulb, Palette, GitPullRequest, FileCheck } from 'lucide-react';

interface SubStep {
  id: string;
  title: string;
  description: string;
  status?: 'default' | 'in-progress' | 'completed' | 'pending';
}

interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  type: 'phase' | 'decision' | 'terminator';
  color: 'amber' | 'blue' | 'purple' | 'rose' | 'emerald';
  icon: string;
  subSteps: SubStep[];
  nextSteps: string[];
  loopTargets: string[];
}

interface FlowchartProcessProps {
  workflowSteps: WorkflowStep[];
}

const iconMap: Record<string, React.ElementType> = {
  Search,
  Lightbulb,
  Palette,
  GitPullRequest,
  FileCheck,
  Sparkles,
};

// ============================================
// COMPACT LINEAR WORKFLOW - ALL VISIBLE
// ============================================

const CompactWorkflow = ({ steps }: { steps: WorkflowStep[] }) => {
  // Defensive: ensure steps is array
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return <div className="text-gray-400 text-sm italic py-4">Workflow data tidak tersedia</div>;
  }

  const PhaseCard = ({ step, isLast }: { step: WorkflowStep; isLast: boolean }) => {
    const Icon = iconMap[step.icon] || Sparkles;
    const colorClasses = {
      amber: 'bg-amber-100 border-amber-400 text-amber-800',
      blue: 'bg-blue-100 border-blue-400 text-blue-800',
      purple: 'bg-purple-100 border-purple-400 text-purple-800',
      rose: 'bg-rose-100 border-rose-400 text-rose-800',
      emerald: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    }[step.color || 'amber'];

    // Defensive: ensure loopTargets is array
    const loopTargets = step.loopTargets || [];

    return (
      <div className="relative">
        {/* Phase Header Card */}
        <div className={`rounded-xl border-2 p-3 ${colorClasses}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-70">{step.number || '?'}</span>
                <h3 className="font-bold text-sm">{step.title || 'Untitled'}</h3>
              </div>
              <p className="text-xs opacity-80 truncate">{step.subtitle || ''}</p>
            </div>
            {loopTargets.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] bg-white/50 px-2 py-1 rounded-full">
                <RotateCcw className="w-3 h-3" />
                <span>Iteratif</span>
              </div>
            )}
          </div>
        </div>

        {/* Spacer between phase and sub-steps */}
        <div className="flex justify-center py-2">
          <div className="w-0.5 h-5 bg-gray-200" />
        </div>

        {/* Loop arrows for desktop */}
        {loopTargets.length > 0 && !isLast && (
          <div className="hidden lg:block absolute right-0 top-1/2 translate-x-[110%] -translate-y-1/2">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
              <RotateCcw className="w-3 h-3" />
              <span>Revisi ke: {loopTargets.join(', ')}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SubStepCard = ({ 
    sub, 
    color, 
    phaseNum,
    isLast 
  }: { 
    sub: SubStep; 
    color: string; 
    phaseNum: string;
    isLast: boolean;
  }) => {
    const colorDot = {
      amber: 'bg-amber-400',
      blue: 'bg-blue-400',
      purple: 'bg-purple-400',
      rose: 'bg-rose-400',
      emerald: 'bg-emerald-400',
    }[color] || 'bg-gray-400';

    return (
      <div className="relative pl-8">
        {/* Timeline connector */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" 
             style={{ bottom: isLast ? '50%' : '0' }} />
        
        {/* Dot */}
        <div className={`absolute left-2 top-3 w-2 h-2 rounded-full ${colorDot}`} />
        
        {/* Sub-step mini card */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all mb-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{phaseNum}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-gray-800 truncate">{sub.title || 'Untitled'}</h4>
              <p className="text-[10px] text-gray-500 line-clamp-1">{sub.description || ''}</p>
            </div>
            <Circle className="w-3 h-3 text-gray-300 flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500">Alur proses desain dari awal sampai finishing</p>
      </div>

      {/* Linear Flow */}
      <div className="space-y-0">
        {steps.map((step, stepIdx) => {
          // Skip invalid steps
          if (!step) return null;
          
          const isLastPhase = stepIdx === steps.length - 1;
          const subSteps = step.subSteps || [];
          
          return (
            <div key={step.id || `step-${stepIdx}`} className="relative mb-6">
              {/* Phase Header */}
              <PhaseCard step={step} isLast={isLastPhase} />
              
              {/* Sub-steps container */}
              <div className="mt-2 mb-3 space-y-2">
                {subSteps.map((sub, subIdx) => {
                  if (!sub) return null;
                  const isLastSub = subIdx === subSteps.length - 1 && isLastPhase;
                  return (
                    <SubStepCard
                      key={sub.id || `sub-${subIdx}`}
                      sub={sub}
                      color={step.color}
                      phaseNum={step.number}
                      isLast={isLastSub}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase">Keterangan:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Discovery
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Strategy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Execution
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Refinement
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Delivery
          </span>
          <span className="flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3 text-gray-400" /> Revisi/Loop
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN EXPORT - Hanya workflowSteps
// ============================================

export const FlowchartProcess = ({ workflowSteps }: FlowchartProcessProps) => {
  return <CompactWorkflow steps={workflowSteps} />;
};

export default FlowchartProcess;
