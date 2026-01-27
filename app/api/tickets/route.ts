import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/tickets - Create new ticket
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
        const { projectId, title, description, priority, assignedToUserId, status } =
            body;

        if (!projectId || !title || !assignedToUserId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        const { data: ticket, error } = await supabase
            .from("tickets")
            .insert({
                project_id: projectId,
                title: title.trim(),
                description: description?.trim() || null,
                priority: priority || "medium",
                assigned_to_user_id: assignedToUserId,
                status: status || "open",
                total_duration: 0,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating ticket:", error);
            console.error("Ticket creation error details:", JSON.stringify(error, null, 2));
            
            // Check for RLS/permission errors
            if (error.code === "42501" || error.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking ticket creation. Check your RLS policies.",
                        code: error.code,
                        hint: error.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to create ticket",
                    details: error.message,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 },
            );
        }

        // Fetch ticket with empty work logs array
        const ticketWithLogs = {
            ...ticket,
            work_logs: [],
        };

        return NextResponse.json({ ticket: ticketWithLogs }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
