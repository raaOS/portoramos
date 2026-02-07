import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
    src: string;
}

export default function OptimizedImage({
    src,
    alt,
    width,
    height,
    fill,
    className,
    ...props
}: OptimizedImageProps) {
    // If the image is from GitHub, proxy it through our API route
    // This allows us to serve it with long-term cache headers and bypass raw.githubusercontent limits/headers
    const proxiedSrc = src && (src.includes('raw.githubusercontent.com') || src.startsWith('/assets/'))
        ? `/api/media?url=${encodeURIComponent(src.startsWith('/') ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${src}` : src)}`
        : src;

    // Final check: if it's just a relative path /assets/... we should also proxy it in Prod
    // because Vercel static assets don't have optimal caching for this use case if we want full control.

    return (
        <Image
            src={proxiedSrc || 'https://via.placeholder.com/800x600?text=Image+Not+Found'}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            className={className}
            quality={props.quality || 85}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWUiLz48L3N2Zz4="
            {...props}
        />
    );
}
