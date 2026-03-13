import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';
import aboutDataFallback from '@/data/about.json';

// GET Handler - Hanya return workflowSteps
export async function GET() {
    try {
        const snapshot = await db.ref('content/about').once('value');
        const firebaseData = snapshot.val() || {};

        // Ambil dari Firebase kalau ada, kalau gak ada dari JSON fallback
        const workflowSteps = firebaseData.designPhilosophy?.workflowSteps 
            || aboutDataFallback.designPhilosophy?.workflowSteps 
            || [];

        const result = {
            heading: firebaseData.designPhilosophy?.heading 
                || aboutDataFallback.designPhilosophy?.heading 
                || "Design Philosophy",
            subheading: firebaseData.designPhilosophy?.subheading 
                || aboutDataFallback.designPhilosophy?.subheading 
                || "Strategic Thinking Framework",
            workflowSteps: workflowSteps
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch Design Philosophy:', error);
        // Return fallback data on error
        return NextResponse.json({
            heading: aboutDataFallback.designPhilosophy?.heading || "Design Philosophy",
            subheading: aboutDataFallback.designPhilosophy?.subheading || "Strategic Thinking Framework",
            workflowSteps: aboutDataFallback.designPhilosophy?.workflowSteps || []
        });
    }
}

// POST Handler (Update) - Hanya simpan workflowSteps
export async function POST(request: NextRequest) {
    try {
        if (!await validateAdminRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newData = await request.json();

        // Validate required fields
        if (!newData.heading || !newData.subheading) {
            return NextResponse.json(
                { error: 'Missing required fields: heading, subheading' },
                { status: 400 }
            );
        }

        // Validate workflowSteps exists
        if (!newData.workflowSteps || !Array.isArray(newData.workflowSteps)) {
            return NextResponse.json(
                { error: 'Missing required field: workflowSteps' },
                { status: 400 }
            );
        }

        // Prepare data for storage - Hanya workflowSteps
        const dataToSave = {
            heading: newData.heading,
            subheading: newData.subheading,
            workflowSteps: newData.workflowSteps
        };

        // Update in Firebase Realtime Database
        await db.ref('content/about/designPhilosophy').set(dataToSave);
        await db.ref('content/about/lastUpdated').set(new Date().toISOString());

        console.log('[API] Design Philosophy updated successfully');

        return NextResponse.json({ 
            success: true, 
            data: dataToSave,
            message: 'Data berhasil disimpan'
        });
    } catch (error) {
        console.error('Failed to update Design Philosophy:', error);
        return NextResponse.json(
            { error: 'Failed to update data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
