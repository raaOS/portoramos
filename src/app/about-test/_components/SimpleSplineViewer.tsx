'use client';

import Script from 'next/script';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { url?: string; 'loading-anim-type'?: string }, HTMLElement>;
        }
    }
}

export default function SimpleSplineViewer() {
    return (
        <div className="w-full h-full">
            <Script
                type="module"
                src="https://unpkg.com/@splinetool/viewer@1.12.37/build/spline-viewer.js"
                strategy="lazyOnload"
            />
            <spline-viewer
                url="https://prod.spline.design/sE14LiWrblts8dEX/scene.splinecode"
                className="w-full h-full"
            />
        </div>
    );
}
