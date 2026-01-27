import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/teams/[id] - Get team details with projects
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: teamId } = await params;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user is a member of the team
        const { data: teamMember } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("team_id", teamId)
            .eq("user_id", user.id)
            .single();

        if (!teamMember) {
            return NextResponse.json(
                { error: "Not a member of this team" },
                { status: 403 },
            );
        }

        // Get team details
        const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", teamId)
            .single();

        if (teamError) {
            console.error("Error fetching team:", teamError);
            return NextResponse.json(
                { error: "Failed to fetch team" },
                { status: 500 },
            );
        }

        // Get projects for the team
        const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select("*")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false });

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json(
                { error: "Failed to fetch projects" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            team,
            projects: projects || [],
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
