import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'metrics.json');
const GITHUB_PATH = 'src/data/metrics.json';

interface ProjectMetrics {
    likes: number;
    shares: number;
}

interface MetricsData {
    metrics: Record<string, ProjectMetrics>;
}

async function getMetricsData(): Promise<MetricsData> {
    const isDev = process.env.NODE_ENV === 'development';
    let data: MetricsData | null = null;

    if (isDev) {
        await ensureDataDir();
        data = (await loadData(DATA_FILE)) as MetricsData | null;
    } else {
        try {
            const ghData = await githubService.getFileContent<MetricsData>(GITHUB_PATH);
            data = ghData.content;
        } catch (error) {
            console.warn('Failed to fetch metrics from GitHub:', error);
        }
    }

    if (!data) {
        data = { metrics: {} };
    }
    return data;
}

export async function GET(request: NextRequest) {
    try {
        const data = await getMetricsData();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (slug) {
            return NextResponse.json(data.metrics[slug] || { likes: 0, shares: 0 });
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

        const isDev = process.env.NODE_ENV === 'development';
        let currentData = await getMetricsData();

        // Initialize if not exists
        if (!currentData.metrics[slug]) {
            currentData.metrics[slug] = { likes: 0, shares: 0 };
        }

        // Update logic
        if (action === 'like') {
            currentData.metrics[slug].likes += 1;
        } else if (action === 'unlike') {
            currentData.metrics[slug].likes = Math.max(0, currentData.metrics[slug].likes - 1);
        } else if (action === 'share') {
            currentData.metrics[slug].shares += 1;
        }

        // Save
        if (isDev) {
            await ensureDataDir();
            const success = await saveData(DATA_FILE, currentData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateFile(GITHUB_PATH, currentData, `Update metrics: ${action} on ${slug}`);
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return NextResponse.json({ success: true, metrics: currentData.metrics[slug] });
    } catch (error) {
        console.error('Error saving metrics:', error);
        return NextResponse.json({ error: 'Failed to save metrics' }, { status: 500 });
    }
}
