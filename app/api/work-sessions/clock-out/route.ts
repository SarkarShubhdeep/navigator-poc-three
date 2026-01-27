import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/work-sessions/clock-out - Clock out (end work session)
export async function POST() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use the database function to clock out
        const { data: session, error } = await supabase.rpc("clock_out");

        if (error) {
            console.error("Error clocking out:", error);
            if (error.message.includes("No active work session")) {
                return NextResponse.json(
                    { error: "No active work session found" },
                    { status: 404 },
                );
            }
            return NextResponse.json(
                { error: "Failed to clock out" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            workSession: session,
            totalDuration: session.total_duration,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
