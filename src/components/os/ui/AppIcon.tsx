import React from 'react';
import Image from 'next/image';

import type { LucideIcon } from 'lucide-react';

interface AppIconProps {
  color?: string;
  icon?: LucideIcon;
  imageUrl?: string;
  priority?: boolean;
}

const AppIcon = ({ color, icon: Icon, imageUrl, priority = false }: AppIconProps) => {
  const [imgError, setImgError] = React.useState(false);

  if (imageUrl && !imgError) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[18px]">
        <Image
          src={imageUrl}
          alt="icon"
          width={128}
          height={128}
          className="h-full w-full scale-[1.01] object-cover"
          style={{ imageRendering: 'auto', backfaceVisibility: 'hidden' }}
          quality={75}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={`h-full w-full rounded-[18px] bg-gradient-to-b ${color} relative flex items-center justify-center`}
    >
      {Icon && <Icon className="text-white" size="65%" strokeWidth={2} />}
    </div>
  );
};

export default AppIcon;
