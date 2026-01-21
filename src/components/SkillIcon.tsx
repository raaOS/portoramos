import { getIconMap } from '@/constants/skillIcons';

interface SkillIconProps {
  type: string;
  className?: string;
}

export default function SkillIcon({ type, className = "w-8 h-8" }: SkillIconProps) {
  const iconMap = getIconMap(className);

  return (iconMap[type] || iconMap.design) as JSX.Element;
}
