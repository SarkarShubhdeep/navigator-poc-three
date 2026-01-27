import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/teams/[id]/members - Get all members from all projects in a team
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

        // Get all projects for the team
        const { data: projects, error: projectsError } = await supabase
            .from("projects")
            .select("id")
            .eq("team_id", teamId);

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            return NextResponse.json(
                { error: "Failed to fetch projects" },
                { status: 500 },
            );
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json({ members: [] });
        }

        const projectIds = projects.map((p) => p.id);

        // Get all project members from all projects in the team
        // Use DISTINCT ON to get unique members (in case user is in multiple projects)
        const { data: members, error: membersError } = await supabase
            .from("project_members")
            .select("user_id, full_name, email, is_online")
            .in("project_id", projectIds);

        if (membersError) {
            console.error("Error fetching members:", membersError);
            return NextResponse.json(
                { error: "Failed to fetch members" },
                { status: 500 },
            );
        }

        // Deduplicate members by user_id (keep the first occurrence)
        const uniqueMembers = Array.from(
            new Map(
                (members || []).map((m) => [m.user_id, m])
            ).values()
        );

        return NextResponse.json({ members: uniqueMembers });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
