import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { projectService } from '@/lib/services/projectService';

interface ProjectMetrics {
    likes: number;
    shares: number;
}

interface MetricsData {
    metrics: Record<string, ProjectMetrics>;
}

async function getMetricsData(): Promise<MetricsData> {
    try {
        const snap = await db.ref('metrics').once('value');
        const data = snap.val();
        return data || { metrics: {} };
    } catch {
        return { metrics: {} };
    }
}

// Helper to get fallback metrics from main project data
async function getFallbackMetrics(slug: string): Promise<ProjectMetrics> {
    try {
        const { projects } = await projectService.getProjects();
        const project = projects.find(p => p.slug === slug);
        if (project) {
            return {
                likes: project.likes || 0,
                shares: project.shares || 0
            };
        }
    } catch (e) {
        console.error('Error fetching fallback metrics:', e);
    }
    return { likes: 0, shares: 0 };
}

export async function GET(request: NextRequest) {
    try {
        const data = await getMetricsData();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            if (data.metrics[slug]) {
                return NextResponse.json(data.metrics[slug]);
            }
            const fallback = await getFallbackMetrics(slug);
            return NextResponse.json(fallback);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error loading metrics:', error);
        return NextResponse.json({ likes: 0, shares: 0 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slug, action } = body; // action: 'like' | 'unlike' | 'share'

        if (!slug || !action) {
            return NextResponse.json({ error: 'Missing slug or action' }, { status: 400 });
        }

        const metricsRef = db.ref(`metrics/metrics/${slug}`);
        const snap = await metricsRef.once('value');
        let metrics = snap.val();

        // Initialize if not exists, using fallback data as baseline
        if (!metrics) {
            metrics = await getFallbackMetrics(slug);
        }

        // Update logic
        if (action === 'like') {
            metrics.likes = (metrics.likes || 0) + 1;
        } else if (action === 'unlike') {
            metrics.likes = Math.max(0, (metrics.likes || 0) - 1);
        } else if (action === 'share') {
            metrics.shares = (metrics.shares || 0) + 1;
        }

        // Save to Firebase
        await metricsRef.set(metrics);

        return NextResponse.json({ success: true, metrics });
    } catch (error) {
        console.error('Error saving metrics:', error);
        return NextResponse.json({ error: 'Failed to save metrics' }, { status: 500 });
    }
}
