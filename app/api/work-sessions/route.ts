import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/work-sessions - Get user's work session history
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all work sessions for the user, ordered by clock_in_time DESC
        const { data: sessions, error: sessionsError } = await supabase
            .from("work_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order("clock_in_time", { ascending: false });

        if (sessionsError) {
            console.error("Error fetching work sessions:", sessionsError);
            return NextResponse.json(
                { error: "Failed to fetch work sessions" },
                { status: 500 },
            );
        }

        // For each session, fetch its work logs with ticket information
        const sessionsWithLogs = await Promise.all(
            (sessions || []).map(async (session) => {
                const { data: workLogs, error: logsError } = await supabase
                    .from("work_logs")
                    .select(
                        `
                        *,
                        tickets (
                            id,
                            title,
                            project_id
                        )
                    `,
                    )
                    .eq("work_session_id", session.id)
                    .order("start_time", { ascending: false });

                if (logsError) {
                    console.error(
                        `Error fetching work logs for session ${session.id}:`,
                        logsError,
                    );
                }

                return {
                    ...session,
                    work_logs: workLogs || [],
                };
            }),
        );

        return NextResponse.json({
            workSessions: sessionsWithLogs,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
