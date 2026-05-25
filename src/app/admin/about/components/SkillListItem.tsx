'use client';
import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Trash2, Edit2, MoveUp, MoveDown } from 'lucide-react';
import { HardSkill } from '@/types/hardSkill';

interface SkillListItemProps {
  skill: HardSkill;
  index: number;
  totalSkills: number;
  onEdit: (skill: HardSkill) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export default function SkillListItem({
  skill,
  index,
  totalSkills,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SkillListItemProps) {
  return (
    <motion.div
      layout
      className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col gap-1 text-gray-300">
        <button
          onClick={() => onMoveUp(index)}
          className="hover:text-black disabled:opacity-30"
          disabled={index === 0}
          aria-label="Move skill up"
        >
          <MoveUp size={16} />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          className="hover:text-black disabled:opacity-30"
          disabled={index === totalSkills - 1}
          aria-label="Move skill down"
        >
          <MoveDown size={16} />
        </button>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-2">
        {skill.iconUrl && skill.iconUrl !== 'No Icon' ? (
          <Image
            src={skill.iconUrl}
            alt={skill.name}
            width={40}
            height={40}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center text-[10px] font-medium leading-tight text-gray-400">
            No Icon
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold">{skill.name}</h3>
        <div className="flex gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-0.5">{skill.level}</span>
          <span>{skill.details?.length || 0} capabilities</span>
        </div>
      </div>

      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(skill)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 hover:bg-blue-50"
          aria-label={`Edit ${skill.name}`}
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(skill.id)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50"
          aria-label={`Delete ${skill.name}`}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
