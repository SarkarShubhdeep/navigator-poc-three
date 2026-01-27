import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/tickets/[id]/start - Start working on ticket
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

        // Check if user has active work session
        const { data: activeSession } = await supabase.rpc(
            "get_active_work_session",
        );

        if (!activeSession || activeSession.length === 0) {
            return NextResponse.json(
                { error: "You must clock in before working on tickets" },
                { status: 400 },
            );
        }

        const session = activeSession[0];

        // Get ticket to verify it exists and is accessible
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("*, project_id")
            .eq("id", ticketId)
            .single();

        if (ticketError || !ticket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 },
            );
        }

        if (ticket.status === "close") {
            return NextResponse.json(
                { error: "Cannot start work on closed ticket" },
                { status: 400 },
            );
        }

        // Create work log with start time (end_time will be NULL until paused)
        const startTime = new Date();
        const { data: workLog, error: workLogError } = await supabase
            .from("work_logs")
            .insert({
                ticket_id: ticketId,
                user_id: user.id,
                work_session_id: session.id,
                start_time: startTime.toISOString(),
                end_time: null, // Will be set when ticket is paused
                duration: null, // Will be calculated when ticket is paused
            })
            .select()
            .single();

        if (workLogError) {
            console.error("Error creating work log:", workLogError);
            console.error("Work log error details:", JSON.stringify(workLogError, null, 2));
            
            // Check for RLS/permission errors
            if (workLogError.code === "42501" || workLogError.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking work log creation. Check your RLS policies.",
                        code: workLogError.code,
                        hint: workLogError.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to start ticket work",
                    details: workLogError.message,
                    code: workLogError.code,
                    hint: workLogError.hint
                },
                { status: 500 },
            );
        }

        // Update ticket status to active
        const { error: updateError } = await supabase
            .from("tickets")
            .update({ status: "active" })
            .eq("id", ticketId);

        if (updateError) {
            console.error("Error updating ticket status:", updateError);
        }

        return NextResponse.json({
            workLog,
            ticket: { ...ticket, status: "active" },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
