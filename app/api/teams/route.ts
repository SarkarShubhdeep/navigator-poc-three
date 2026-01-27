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

        // Fetch only teams the current user is a member of (via team_members)
        const { data: memberships, error: memError } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id);

        if (memError) {
            console.error("Error fetching team memberships:", memError);
            return NextResponse.json(
                { error: "Failed to fetch teams", details: memError.message },
                { status: 500 },
            );
        }

        const teamIds = (memberships || []).map((m) => m.team_id);
        if (teamIds.length === 0) {
            return NextResponse.json({ teams: [] });
        }

        const { data: teams, error } = await supabase
            .from("teams")
            .select("*")
            .in("id", teamIds)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching teams:", error);
            return NextResponse.json(
                { error: "Failed to fetch teams", details: error.message },
                { status: 500 },
            );
        }

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
