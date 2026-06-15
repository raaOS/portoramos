import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { projectService } from '@/lib/services/projectService';
import { enforceRequestRateLimit } from '@/lib/security/request';
import { z } from 'zod';

interface ProjectMetrics {
  likes: number;
  shares: number;
}

interface MetricsData {
  metrics: Record<string, ProjectMetrics>;
}

const metricsMutationSchema = z.object({
  slug: z.string().min(1).max(200),
  action: z.enum(['like', 'unlike', 'share']),
});

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
    const project = projects.find((p) => p.slug === slug);
    if (project) {
      return {
        likes: project.likes || 0,
        shares: project.shares || 0,
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
    const rateLimit = await enforceRequestRateLimit(request, 'metrics_mutation', 60, 60000, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await request.json();
    const validation = metricsMutationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid slug or action' }, { status: 400 });
    }

    const { slug, action } = validation.data;
    const metricsRef = db.ref(`metrics/metrics/${slug}`);
    const fallbackMetrics = await getFallbackMetrics(slug);
    let updatedMetrics: ProjectMetrics = fallbackMetrics;

    await metricsRef.transaction((current: ProjectMetrics | null) => {
      const base = current || fallbackMetrics;
      const next = {
        likes: base.likes || 0,
        shares: base.shares || 0,
      };

      if (action === 'like') {
        next.likes += 1;
      } else if (action === 'unlike') {
        next.likes = Math.max(0, next.likes - 1);
      } else if (action === 'share') {
        next.shares += 1;
      }

      updatedMetrics = next;
      return next;
    });

    return NextResponse.json({ success: true, metrics: updatedMetrics });
  } catch (error) {
    console.error('Error saving metrics:', error);
    return NextResponse.json({ error: 'Failed to save metrics' }, { status: 500 });
  }
}
