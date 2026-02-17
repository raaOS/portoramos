'use client';

import { useEffect } from 'react';

/**
 * Speculation Rules API Component
 * Enables the browser to pre-render or pre-fetch pages in the background
 * based on user behavior (hover/pointerdown).
 * 
 * This results in near 0ms navigation between primary pages.
 */
export default function SpeculationRules() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check for browser support
        if (!HTMLScriptElement.supports?.('speculationrules')) return;

        const specScript = document.createElement('script');
        specScript.type = 'speculationrules';

        const speculationRules = {
            "prerender": [{
                "source": "list",
                "urls": ["/about", "/contact", "/projects"],
                "score": 0.5
            }, {
                "source": "document",
                "where": {
                    "and": [
                        { "href_matches": "/*" },
                        { "not": { "href_matches": "/api/*" } },
                        { "not": { "href_matches": "/admin/*" } }
                    ]
                },
                "eagerness": "conservative"
            }]
        };

        specScript.textContent = JSON.stringify(speculationRules);
        document.head.appendChild(specScript);

        return () => {
            if (document.head.contains(specScript)) {
                document.head.removeChild(specScript);
            }
        };
    }, []);

    return null;
}
