import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// POST /api/teams/join - Join team by invite code
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
        const { inviteCode } = body;

        if (!inviteCode || typeof inviteCode !== "string") {
            return NextResponse.json(
                { error: "Invite code is required" },
                { status: 400 },
            );
        }

        // Normalize invite code
        const normalizedCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, "");

        if (normalizedCode.length !== 6) {
            return NextResponse.json(
                { error: "Invalid invite code format" },
                { status: 400 },
            );
        }

        // Use the database function to join team
        const { data: team, error } = await supabase.rpc("join_team_by_code", {
            p_invite_code: normalizedCode,
        });

        if (error) {
            console.error("Error joining team:", error);
            // Check for specific error messages
            if (error.message.includes("already a member")) {
                return NextResponse.json(
                    { error: "You are already a member of this team" },
                    { status: 409 },
                );
            }
            if (error.message.includes("not found")) {
                return NextResponse.json(
                    { error: "Team not found with this invite code" },
                    { status: 404 },
                );
            }
            return NextResponse.json(
                { error: "Failed to join team" },
                { status: 500 },
            );
        }

        return NextResponse.json({ team }, { status: 200 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
