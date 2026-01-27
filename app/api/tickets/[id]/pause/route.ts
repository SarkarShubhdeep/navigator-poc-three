import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/tickets/[id]/pause - Pause ticket work
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: ticketId } = await params;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { description } = body || {};

        // Find the most recent active work log for this ticket by this user
        // Active work logs have end_time = NULL OR end_time = start_time (legacy case)
        // We'll check for NULL first, then fall back to checking if end_time equals start_time
        let { data: workLogs, error: workLogsError } = await supabase
            .from("work_logs")
            .select("*")
            .eq("ticket_id", ticketId)
            .eq("user_id", user.id)
            .is("end_time", null) // Only get active work logs (not paused yet)
            .order("start_time", { ascending: false })
            .limit(1);

        // If no NULL end_time found, check for legacy case where end_time = start_time
        if ((!workLogs || workLogs.length === 0) && !workLogsError) {
            const { data: allWorkLogs } = await supabase
                .from("work_logs")
                .select("*")
                .eq("ticket_id", ticketId)
                .eq("user_id", user.id)
                .order("start_time", { ascending: false })
                .limit(5); // Get a few recent ones to check

            if (allWorkLogs && allWorkLogs.length > 0) {
                // Find one where end_time equals start_time (legacy active work log)
                workLogs = allWorkLogs.filter(
                    (log) => log.end_time && log.start_time && 
                    new Date(log.end_time).getTime() === new Date(log.start_time).getTime()
                ).slice(0, 1);
            }
        }

        if (workLogsError) {
            console.error("Error fetching work logs:", workLogsError);
            return NextResponse.json(
                { error: "Failed to fetch work logs" },
                { status: 500 },
            );
        }

        if (!workLogs || workLogs.length === 0) {
            return NextResponse.json(
                { error: "No active work log found for this ticket" },
                { status: 404 },
            );
        }

        const workLog = workLogs[0];
        const endTime = new Date();
        const startTime = new Date(workLog.start_time);
        
        // Ensure end_time is definitely after start_time (add 1 second if needed)
        // This prevents constraint violations for very short durations
        const finalEndTime = endTime.getTime() <= startTime.getTime() 
            ? new Date(startTime.getTime() + 1000) 
            : endTime;
        
        // Calculate duration based on the ACTUAL finalEndTime we're sending
        // PostgreSQL's EXTRACT(EPOCH FROM ...)::INTEGER truncates (not floors)
        // So we need to match that exactly. Use Math.trunc instead of Math.floor
        const timeDiffMs = finalEndTime.getTime() - startTime.getTime();
        const timeDiffSeconds = timeDiffMs / 1000;
        // Truncate (not floor) to match PostgreSQL's INTEGER cast behavior
        const durationSeconds = Math.trunc(timeDiffSeconds);

        console.log("Updating work log:", {
            workLogId: workLog.id,
            startTime: startTime.toISOString(),
            endTime: finalEndTime.toISOString(),
            duration: durationSeconds,
            timeDiffMs,
            timeDiffSeconds,
            originalEndTime: workLog.end_time
        });

        // Update work log with end time, duration, and description
        // Note: We calculate duration here, but PostgreSQL will also verify it matches
        // EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER
        const { data: updatedWorkLog, error: updateError } = await supabase
            .from("work_logs")
            .update({
                end_time: finalEndTime.toISOString(),
                duration: durationSeconds,
                description: description?.trim() || null,
            })
            .eq("id", workLog.id)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating work log:", updateError);
            console.error("Update error details:", JSON.stringify(updateError, null, 2));
            
            // Check for RLS/permission errors
            if (updateError.code === "42501" || updateError.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking work log update. Check your RLS policies.",
                        code: updateError.code,
                        hint: updateError.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to pause ticket work",
                    details: updateError.message,
                    code: updateError.code,
                    hint: updateError.hint
                },
                { status: 500 },
            );
        }

        // Update ticket status back to open
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .update({ status: "open" })
            .eq("id", ticketId)
            .select()
            .single();

        if (ticketError) {
            console.error("Error updating ticket:", ticketError);
        }

        // Fetch all work logs for the ticket
        const { data: allWorkLogs } = await supabase
            .from("work_logs")
            .select("*")
            .eq("ticket_id", ticketId)
            .order("start_time", { ascending: false });

        const ticketWithLogs = {
            ...ticket,
            work_logs: allWorkLogs || [],
        };

        return NextResponse.json({
            workLog: updatedWorkLog,
            ticket: ticketWithLogs,
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
