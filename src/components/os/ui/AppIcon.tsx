import React from 'react';
import Image from 'next/image';

import type { LucideIcon } from 'lucide-react';

interface AppIconProps {
  color?: string;
  icon?: LucideIcon;
  imageUrl?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}

const AppIcon = ({
  color = 'from-indigo-500 to-purple-600',
  icon: Icon,
  imageUrl,
  priority = false,
  fallback,
  className = 'h-full w-full',
}: AppIconProps) => {
  const [imgError, setImgError] = React.useState(false);

  if (imageUrl && !imgError) {
    return (
      <div
        className={`flex ${className} items-center justify-center overflow-hidden rounded-[18px]`}
      >
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

  if (imgError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`${className} rounded-[18px] bg-gradient-to-b ${color} relative flex items-center justify-center`}
    >
      {Icon && <Icon className="text-white" size="65%" strokeWidth={2} />}
    </div>
  );
};

export default AppIcon;
