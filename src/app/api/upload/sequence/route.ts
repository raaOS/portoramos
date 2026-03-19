import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "@/lib/auth";
import { bucket, db } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const sequenceName = formData.get("sequenceName") as string;

        if (!files.length || !sequenceName) {
            return NextResponse.json(
                { error: "Missing files or sequence name" },
                { status: 400 }
            );
        }

        // Sanitize sequence name
        const cleanName = sequenceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const storagePath = `assets/sequence/${cleanName}`;

        // Upload all files to Firebase Storage
        await Promise.all(
            files.map(async (file) => {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const filePath = `${storagePath}/${file.name}`;
                const storageFile = bucket.file(filePath);
                await storageFile.save(buffer, {
                    metadata: { contentType: file.type }
                });
            })
        );

        return NextResponse.json({
            success: true,
            path: storagePath,
            count: files.length
        });
    } catch (error) {
        console.error("Sequence upload error:", error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET: List all sequence folders from Firebase Storage
export async function GET() {
    try {
        const [files] = await bucket.getFiles({ prefix: 'assets/sequence/' });

        // Group files by folder name
        const folderMap = new Map<string, { name: string, frames: number }>();

        files.forEach(file => {
            const parts = file.name.replace('assets/sequence/', '').split('/');
            if (parts.length >= 2 && parts[0]) {
                const folderName = parts[0];
                const current = folderMap.get(folderName) || { name: folderName, frames: 0 };
                current.frames++;
                folderMap.set(folderName, current);
            }
        });

        const folders = Array.from(folderMap.values()).map(f => ({
            name: f.name,
            frames: f.frames,
            path: `assets/sequence/${f.name}`
        }));

        return NextResponse.json(folders);
    } catch (error) {
        console.error("List sequences error:", error);
        return NextResponse.json({ error: "Failed to list available sequences" }, { status: 500 });
    }
}

// DELETE: Remove a sequence folder from Firebase Storage
export async function DELETE(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const folderName = searchParams.get("name");

        if (!folderName) {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        // Safety check
        if (folderName.includes("..") || folderName.includes("/") || folderName.includes("\\")) {
            return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
        }

        const prefix = `assets/sequence/${folderName}/`;
        const [files] = await bucket.getFiles({ prefix });

        if (files.length === 0) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        await Promise.all(files.map(file => file.delete()));

        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        console.error("Delete sequence error:", error);
        return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
    }
}

// PATCH: Activate a sequence (save config to Firebase DB)
export async function PATCH(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Sequence name required" }, { status: 400 });
        }

        await db.ref('content/sequence-config').set({ activeSequence: name, updatedAt: new Date().toISOString() });

        return NextResponse.json({ success: true, activeSequence: name });
    } catch (error) {
        console.error("Activate sequence error:", error);
        return NextResponse.json({ error: "Failed to activate sequence" }, { status: 500 });
    }
}
