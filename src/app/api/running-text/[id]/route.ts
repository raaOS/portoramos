import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RunningTextItem, RunningTextData } from '@/types/runningText';

const DATA_FILE = path.join(process.cwd(), 'data', 'running-text.json');

function getRunningTextData(): RunningTextData {
    if (!fs.existsSync(DATA_FILE)) {
        return { items: [] };
    }
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    try {
        return JSON.parse(fileContent);
    } catch (error) {
        return { items: [] };
    }
}

function saveRunningTextData(data: RunningTextData) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const data = getRunningTextData();

        const index = data.items.findIndex((item) => item.id === id);
        if (index === -1) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Update fields
        const updatedItem = {
            ...data.items[index],
            ...body,
            updatedAt: new Date().toISOString(),
        };

        data.items[index] = updatedItem;
        data.lastUpdated = new Date().toISOString();
        saveRunningTextData(data);

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('Error updating running text:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = getRunningTextData();

        const initialLength = data.items.length;
        data.items = data.items.filter((item) => item.id !== id);

        if (data.items.length === initialLength) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        data.lastUpdated = new Date().toISOString();
        saveRunningTextData(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
