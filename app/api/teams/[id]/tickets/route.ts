import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/teams/[id]/tickets - Get all tickets from all projects in a team
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
            return NextResponse.json({ tickets: [] });
        }

        const projectIds = projects.map((p) => p.id);

        // Get all tickets from all projects in the team
        const { data: tickets, error: ticketsError } = await supabase
            .from("tickets")
            .select(
                `
                *,
                work_logs(*)
            `,
            )
            .in("project_id", projectIds)
            .order("last_worked_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (ticketsError) {
            console.error("Error fetching tickets:", ticketsError);
            return NextResponse.json(
                { error: "Failed to fetch tickets" },
                { status: 500 },
            );
        }

        return NextResponse.json({ tickets: tickets || [] });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
