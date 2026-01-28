import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// GET /api/work-logs - Get user's work logs with optional date range filter
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build base query for work logs
        let query = supabase
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
            .eq("user_id", user.id);

        // Apply date range filter if provided
        if (startDate) {
            query = query.gte("start_time", startDate);
        }
        if (endDate) {
            // Add 1 day to endDate to include the entire end date
            const endDatePlusOne = new Date(endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            query = query.lt("start_time", endDatePlusOne.toISOString());
        }

        // Add ordering
        query = query.order("start_time", { ascending: true });

        const { data: workLogs, error } = await query;

        if (error) {
            console.error("Error fetching work logs:", error);
            console.error("Work logs error details:", JSON.stringify(error, null, 2));
            
            // Check for RLS/permission errors
            if (error.code === "42501" || error.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking access. Check your RLS policies.",
                        code: error.code,
                        hint: error.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to fetch work logs",
                    details: error.message,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            workLogs: workLogs || [],
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 },
        );
    }
}
