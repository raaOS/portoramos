import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RunningTextItem, RunningTextData } from '@/types/runningText';
import { v4 as uuidv4 } from 'uuid';

const DATA_FILE = path.join(process.cwd(), 'data', 'running-text.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initial data if file doesn't exist
const initialData: RunningTextData = {
    items: [
        { id: '1', text: 'AVAILABLE FOR FREELANCE PROJECT', order: 1, isActive: true },
        { id: '2', text: 'OPEN FOR COLLABORATION', order: 2, isActive: true },
        { id: '3', text: 'CREATIVE DESIGNER', order: 3, isActive: true },
    ],
    lastUpdated: new Date().toISOString(),
};

function getRunningTextData(): RunningTextData {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        return initialData;
    }
}

function saveRunningTextData(data: RunningTextData) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
    const data = getRunningTextData();
    // Sort by order
    data.items.sort((a, b) => a.order - b.order);
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, order, isActive } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const data = getRunningTextData();
        const newItem: RunningTextItem = {
            id: uuidv4(),
            text,
            order: order || data.items.length + 1,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        data.items.push(newItem);
        data.lastUpdated = new Date().toISOString();
        saveRunningTextData(data);

        return NextResponse.json(newItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // This is for bulk updates (ordering)
    try {
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        const data = getRunningTextData();
        // Update all items order
        data.items = items;
        data.lastUpdated = new Date().toISOString();
        saveRunningTextData(data);

        return NextResponse.json({ success: true, items: data.items });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
    }
}
