import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { mkdir, writeFile, readdir, stat, rm } from "fs/promises";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
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

        // 1. Create Directory
        // Public path: public/assets/sequence/[name]
        const relativePath = join("assets", "sequence", sequenceName);
        const absolutePath = join(process.cwd(), "public", relativePath);

        if (!existsSync(absolutePath)) {
            await mkdir(absolutePath, { recursive: true });
        }

        // 2. Save Files
        await Promise.all(
            files.map(async (file) => {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const filePath = join(absolutePath, file.name);
                await writeFile(filePath, buffer);
            })
        );

        return NextResponse.json({
            success: true,
            path: `/${relativePath}`, // Return web-accessible path
            count: files.length
        });

    } catch (error) {
        console.error("Sequence upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// GET: List all sequence folders
export async function GET() {
    try {
        const sequenceDir = join(process.cwd(), "public", "assets", "sequence");

        if (!existsSync(sequenceDir)) {
            return NextResponse.json([]);
        }

        const dirents = await readdir(sequenceDir, { withFileTypes: true });

        // Filter only directories
        const folders = await Promise.all(
            dirents
                .filter((dirent) => dirent.isDirectory())
                .map(async (dirent) => {
                    const folderPath = join(sequenceDir, dirent.name);
                    const stats = await stat(folderPath);
                    const files = await readdir(folderPath);

                    return {
                        name: dirent.name,
                        createdAt: stats.birthtime,
                        frames: files.length,
                        path: `/assets/sequence/${dirent.name}`
                    };
                })
        );

        // Sort by newest first
        folders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json(folders);
    } catch (error) {
        console.error("List sequences error:", error);
        return NextResponse.json({ error: "Failed to list available sequences" }, { status: 500 });
    }
}

// DELETE: Remove a sequence folder
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const folderName = searchParams.get("name");

        if (!folderName) {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        // Safety check: Prevent deleting outside of sequence directory
        if (folderName.includes("..") || folderName.includes("/") || folderName.includes("\\")) {
            return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
        }

        const folderPath = join(process.cwd(), "public", "assets", "sequence", folderName);

        if (!existsSync(folderPath)) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        await rm(folderPath, { recursive: true, force: true });

        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        console.error("Delete sequence error:", error);
        return NextResponse.json({ error: "Failed to delete sequence" }, { status: 500 });
    }
}

// PATCH: Activate a sequence
export async function PATCH(request: NextRequest) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Sequence name required" }, { status: 400 });
        }

        const configPath = join(process.cwd(), "src", "data", "sequence-config.json");
        await writeFile(configPath, JSON.stringify({ activeSequence: name }, null, 2));

        return NextResponse.json({ success: true, activeSequence: name });
    } catch (error) {
        console.error("Activate sequence error:", error);
        return NextResponse.json({ error: "Failed to activate sequence" }, { status: 500 });
    }
}
