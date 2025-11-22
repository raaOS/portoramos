'use client';

import Image from 'next/image';
import { useState } from 'react';
import { HardSkill } from '@/types/hardSkill';

interface Props {
  skills?: HardSkill[];
}

const fallbackSkills: HardSkill[] = [
  {
    id: 'hard-ai',
    name: 'Adobe Illustrator',
    iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/ai.png',
    level: 'Expert',
    order: 1,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'hard-ps',
    name: 'Adobe Photoshop',
    iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/ps.png',
    level: 'Expert',
    order: 2,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'hard-figma',
    name: 'Figma',
    iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/figma.png',
    level: 'Advanced',
    order: 3,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'hard-canva',
    name: 'Canva',
    iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000000/icons/canva.png',
    level: 'Intermediate',
    order: 4,
    createdAt: '',
    updatedAt: '',
  },
];

export default function DesignSkillIcons({ skills }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const data = (skills && skills.length > 0 ? skills : fallbackSkills).sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="flex flex-wrap items-center gap-4 pb-2 pr-4">
      {data.map((skill) => (
        <div
          key={skill.id}
          className="relative flex-shrink-0 group"
          onMouseEnter={() => setHoveredId(skill.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer bg-white shadow-sm overflow-hidden border border-gray-200">
            <Image
              src={skill.iconUrl}
              alt={skill.name}
              width={56}
              height={56}
              className="object-contain w-full h-full"
              unoptimized
            />
          </div>

          {hoveredId === skill.id && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {skill.name} - {skill.level}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
