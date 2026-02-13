import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { aboutService } from "@/lib/services/aboutService";

export async function POST(request: NextRequest) {
    try {
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

        // 3. Update via aboutService (handles merge and GitHub/Local sync)
        await aboutService.updateAboutData({
            desktopPreferences
        });

        return NextResponse.json({
            success: true,
            message: "Desktop preferences saved"
        });

    } catch (error) {
        console.error("Error saving desktop preferences:", error);
        return NextResponse.json(
            { error: "Failed to save desktop preferences" },
            { status: 500 }
        );
    }
}
