import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// GET /api/work-sessions/active - Get user's active work session
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use the database function to get active session
        const { data: sessions, error } = await supabase.rpc(
            "get_active_work_session",
        );

        if (error) {
            console.error("Error fetching active session:", error);
            return NextResponse.json(
                { error: "Failed to fetch active session" },
                { status: 500 },
            );
        }

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({
                workSession: null,
                elapsedTime: 0,
            });
        }

        const session = sessions[0];
        const elapsedSeconds = session.elapsed_seconds || 0;

        return NextResponse.json({
            workSession: {
                id: session.id,
                userId: session.user_id,
                projectId: session.project_id,
                clockInTime: session.clock_in_time,
                clockOutTime: session.clock_out_time,
                totalDuration: session.total_duration,
                isActive: session.is_active,
            },
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
