import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/work-sessions/clock-in - Clock in (start work session)
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const projectId = body?.projectId || null;

        // Use the database function to clock in
        const { data: session, error } = await supabase.rpc("clock_in", {
            p_project_id: projectId,
        });

        if (error) {
            console.error("Error clocking in:", error);
            return NextResponse.json(
                { error: "Failed to clock in" },
                { status: 500 },
            );
        }

        // Calculate elapsed time
        const elapsedSeconds = Math.floor(
            (new Date().getTime() - new Date(session.clock_in_time).getTime()) /
                1000,
        );

        return NextResponse.json({
            workSession: session,
            elapsedTime: elapsedSeconds,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
