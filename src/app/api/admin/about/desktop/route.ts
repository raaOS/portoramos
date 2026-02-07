import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "src/data/about.json");

export async function POST(request: NextRequest) {
    try {
        // 1. Admin Authentication
        // 1. Admin Authentication
        const isAuthenticated = await checkAdminAuth(request);
        if (!isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { desktopPreferences } = body;

        if (!desktopPreferences) {
            return NextResponse.json(
                { error: "desktopPreferences is required" },
                { status: 400 }
            );
        }

        // 3. Read Existing Data
        if (!fs.existsSync(DATA_FILE_PATH)) {
            return NextResponse.json(
                { error: "Data file not found" },
                { status: 500 }
            );
        }

        const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
        const data = JSON.parse(fileContent);

        // 4. Update Preferences (Merge to avoid overwriting other settings if not provided)
        // We assume desktopPreferences overrides the existing object or we merge carefully.
        // Ideally we replace the whole object as the UI sends the full state.

        // Ensure we don't wipe out other un-sent preferences if the client sends partial data, 
        // but typically for this we send the whole object.
        data.desktopPreferences = {
            ...data.desktopPreferences,
            ...desktopPreferences
        };

        // 5. Save Data
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));

        return NextResponse.json({
            success: true,
            message: "Desktop preferences saved"
        });

    } catch (error) {
        console.error("Error saving desktop preferences:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
