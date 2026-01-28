import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    groupByDay,
    getDayOfWeekStats,
    getTopProjects,
    calculateSummary,
    prepareHeatmapData,
    type WorkLog,
} from "@/lib/utils/statistics";
import { startOfDay, endOfDay } from "date-fns";

// GET /api/statistics - Get aggregated statistics for the user
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
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        // Default to last 30 days if no dates provided
        const endDate = endDateParam
            ? endOfDay(new Date(endDateParam))
            : endOfDay(new Date());
        const startDate = startDateParam
            ? startOfDay(new Date(startDateParam))
            : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

        // Fetch work logs with ticket and project information
        const query = supabase
            .from("work_logs")
            .select(
                `
                *,
                tickets (
                    id,
                    title,
                    project_id,
                    projects (
                        id,
                        name
                    )
                )
            `,
            )
            .eq("user_id", user.id)
            .gte("start_time", startDate.toISOString())
            .lt("start_time", endDate.toISOString())
            .order("start_time", { ascending: true });

        const { data: workLogs, error } = await query;

        if (error) {
            console.error("Error fetching work logs:", error);
            return NextResponse.json(
                {
                    error: "Failed to fetch statistics",
                    details: error.message,
                },
                { status: 500 },
            );
        }

        const logs = (workLogs || []) as WorkLog[];

        // Process data using utility functions
        const dailyTotals = groupByDay(logs, startDate, endDate);
        const dayOfWeekStats = getDayOfWeekStats(logs);
        const topProjects = getTopProjects(logs, 10);
        const summary = calculateSummary(logs, dailyTotals);
        const heatmapData = prepareHeatmapData(dailyTotals, startDate, endDate);

        return NextResponse.json({
            summary,
            dailyTotals,
            dayOfWeekStats,
            topProjects,
            heatmapData,
            dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
