import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// GET /api/teams - Get user's teams
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Query teams directly - RLS policy will filter to teams user belongs to
        // The RLS policy checks if user is a member via team_members table
        const { data: teams, error } = await supabase
            .from("teams")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching teams:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            
            // Check for specific RLS errors
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
                    error: "Failed to fetch teams",
                    details: error.message,
                    code: error.code,
                    hint: error.hint
                },
                { status: 500 },
            );
        }

        // If no teams, return empty array (this is valid - user might not be in any teams)
        return NextResponse.json({ teams: teams || [] });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// POST /api/teams - Create new team
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
        const { name } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Team name is required" },
                { status: 400 },
            );
        }

        // Use the database function to create team
        const { data: team, error } = await supabase.rpc("create_team", {
            p_name: name.trim(),
        });

        if (error) {
            console.error("Error creating team:", error);
            return NextResponse.json(
                { error: "Failed to create team" },
                { status: 500 },
            );
        }

        return NextResponse.json({ team }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
