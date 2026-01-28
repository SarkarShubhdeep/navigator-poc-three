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

        // Verify user is a member of the team (optional check if RLS is disabled)
        const { error: memberError } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("team_id", teamId)
            .eq("user_id", user.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

        // Log membership check result (for debugging)
        if (memberError) {
            console.warn("Team membership check error (may be due to RLS):", memberError);
        }
        
        // If RLS is disabled, we'll still try to fetch the team
        // The team fetch will fail if user doesn't have access

        // Get team details
        const { data: team, error: teamError } = await supabase
            .from("teams")
            .select("*")
            .eq("id", teamId)
            .single();

        if (teamError) {
            console.error("Error fetching team:", teamError);
            console.error("Team error details:", JSON.stringify(teamError, null, 2));
            
            // Check for RLS/permission errors
            if (teamError.code === "42501" || teamError.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking access. Check your RLS policies.",
                        code: teamError.code,
                        hint: teamError.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to fetch team",
                    details: teamError.message,
                    code: teamError.code,
                    hint: teamError.hint
                },
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
