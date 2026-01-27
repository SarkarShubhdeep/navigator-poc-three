import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// PATCH /api/tickets/[id] - Update ticket
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const updateData: Record<string, unknown> = {};

        if (body.title !== undefined) updateData.title = body.title.trim();
        if (body.description !== undefined)
            updateData.description = body.description?.trim() || null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.priority !== undefined) updateData.priority = body.priority;
        if (body.assignedToUserId !== undefined)
            updateData.assigned_to_user_id = body.assignedToUserId;

        const { data: ticket, error } = await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating ticket:", error);
            return NextResponse.json(
                { error: "Failed to update ticket" },
                { status: 500 },
            );
        }

        // Fetch work logs for the ticket
        const { data: workLogs } = await supabase
            .from("work_logs")
            .select("*")
            .eq("ticket_id", id)
            .order("start_time", { ascending: false });

        const ticketWithLogs = {
            ...ticket,
            work_logs: workLogs || [],
        };

        return NextResponse.json({ ticket: ticketWithLogs });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
