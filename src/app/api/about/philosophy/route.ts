import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Helper to get path to data file
const getDataFilePath = () => path.join(process.cwd(), 'src/data/about.json');

// Helper to read data
async function getAboutData() {
    const filePath = getDataFilePath();
    try {
        const fileContents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        return null;
    }
}

// GET Handler
export async function GET() {
    const data = await getAboutData();

    if (!data || !data.designPhilosophy) {
        // Return default structure if missing
        return NextResponse.json({
            heading: "Design Philosophy",
            subheading: "Strategic Thinking Framework",
            steps: []
        });
    }

    return NextResponse.json(data.designPhilosophy);
}

// POST Handler (Update)
export async function POST(request: Request) {
    try {
        const newData = await request.json();
        const filePath = getDataFilePath();

        // Read existing data to preserve other sections
        const currentData = await getAboutData() || {};

        // Update only designPhilosophy section
        const updatedData = {
            ...currentData,
            designPhilosophy: newData,
            lastUpdated: new Date().toISOString()
        };

        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));

        return NextResponse.json({ success: true, data: newData });
    } catch (error) {
        console.error('Failed to update Design Philosophy:', error);
        return NextResponse.json(
            { error: 'Failed to update data' },
            { status: 500 }
        );
    }
}
