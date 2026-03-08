import React from 'react';
import Image from 'next/image';

import type { LucideIcon } from "lucide-react";

interface AppIconProps {
    color?: string;
    icon?: LucideIcon;
    imageUrl?: string;
}

const AppIcon = ({ color, icon: Icon, imageUrl }: AppIconProps) => {
    const [imgError, setImgError] = React.useState(false);

    if (imageUrl && !imgError) {
        return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                <Image
                    src={imageUrl}
                    alt="icon"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover scale-[1.01]"
                    style={{ imageRendering: 'auto', backfaceVisibility: 'hidden' }}
                    quality={75}
                    priority={false}
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }
    return (
        <div className={`w-full h-full rounded-xl bg-gradient-to-b ${color} flex items-center justify-center relative`}>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20 inset-ring pointer-events-none" />
            {Icon && <Icon className="text-white" size="65%" strokeWidth={2} />}
        </div>
    );
};

export default AppIcon;
