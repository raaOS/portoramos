import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const strategy = searchParams.get('strategy') || 'mobile';

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO${apiKey ? `&key=${apiKey}` : ''}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        const lighthouseResult = data.lighthouseResult;
        const categories = lighthouseResult.categories;
        const audits = lighthouseResult.audits;

        // Helper to extract audit details
        const getAuditData = (id: string) => {
            const audit = audits[id];
            if (!audit) return null;
            return {
                id: audit.id,
                title: audit.title,
                description: audit.description,
                score: audit.score,
                displayValue: audit.displayValue,
                details: audit.details,
                scoreDisplayMode: audit.scoreDisplayMode,
            };
        };

        // Filter for Opportunities (load opportunities from performance category)
        const performanceAuditRefs = categories.performance.auditRefs;

        const opportunities = performanceAuditRefs
            .filter((ref: any) => ref.group === 'load-opportunities' && audits[ref.id].score !== 1 && audits[ref.id].scoreDisplayMode !== 'notApplicable')
            .map((ref: any) => getAuditData(ref.id))
            .filter(Boolean)
            .sort((a: any, b: any) => (a.score || 0) - (b.score || 0)); // Lower score first (more critical)

        const diagnostics = performanceAuditRefs
            .filter((ref: any) => ref.group === 'diagnostics' && audits[ref.id].score !== 1 && audits[ref.id].scoreDisplayMode !== 'notApplicable')
            .map((ref: any) => getAuditData(ref.id))
            .filter(Boolean);

        const screenshotAudit = audits['final-screenshot'];
        const screenshotData = screenshotAudit?.details?.data; // Base64 data

        const scores = {
            performance: Math.round(categories.performance.score * 100),
            accessibility: Math.round(categories.accessibility.score * 100),
            bestPractices: Math.round(categories['best-practices'].score * 100),
            seo: Math.round(categories.seo.score * 100),
            coreWebVitals: {
                lcp: audits['largest-contentful-paint'].displayValue,
                fcp: audits['first-contentful-paint'].displayValue,
                cls: audits['cumulative-layout-shift'].displayValue,
                tbt: audits['total-blocking-time'].displayValue,
                si: audits['speed-index'].displayValue,
            },
            audits: {
                opportunities,
                diagnostics,
                screenshot: screenshotData
            }
        };

        return NextResponse.json(scores);
    } catch (error) {
        console.error('Error fetching lighthouse data:', error);
        return NextResponse.json({ error: 'Failed to fetch lighthouse data' }, { status: 500 });
    }
}
