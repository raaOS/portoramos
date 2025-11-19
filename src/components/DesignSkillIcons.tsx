'use client';

import { useState } from 'react';

interface SkillIconProps {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  color: string;
}

const skills: SkillIconProps[] = [
  {
    name: 'Adobe Illustrator',
    level: 'Expert',
    color: '#FF6900'
  },
  {
    name: 'Adobe Photoshop',
    level: 'Expert',
    color: '#00C4FF'
  },
  {
    name: 'Figma',
    level: 'Advanced',
    color: '#F24E1E'
  },
  {
    name: 'Canva',
    level: 'Intermediate',
    color: '#00C4CC'
  }
];

const levelColors = {
  Beginner: 'bg-gray-100 text-gray-600',
  Intermediate: 'bg-blue-100 text-blue-600',
  Advanced: 'bg-green-100 text-green-600',
  Expert: 'bg-red-100 text-red-600'
};

export default function DesignSkillIcons() {
  const [hoveredSkill, setHoveredSkill] = useState<SkillIconProps | null>(null);

  return (
    <div className="flex items-center gap-3 pb-2 pr-4">
      {skills.map((skill, index) => (
        <div
          key={skill.name}
          className="relative flex-shrink-0 group"
          onMouseEnter={() => setHoveredSkill(skill)}
          onMouseLeave={() => setHoveredSkill(null)}
        >
          {/* App Logo Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
            style={{ backgroundColor: skill.color }}
          >
            {skill.name === 'Adobe Illustrator' && (
              <span className="text-white font-bold text-xs">AI</span>
            )}
            {skill.name === 'Adobe Photoshop' && (
              <span className="text-white font-bold text-xs">PS</span>
            )}
            {skill.name === 'Figma' && (
              <span className="text-white font-bold text-xs">F</span>
            )}
            {skill.name === 'Canva' && (
              <span className="text-white font-bold text-xs">C</span>
            )}
          </div>

          {/* Simple Tooltip */}
          {hoveredSkill?.name === skill.name && (
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
