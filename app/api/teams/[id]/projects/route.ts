import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/teams/[id]/projects - Get projects for a team
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

        // Get projects for the team
        const { data: projects, error } = await supabase
            .from("projects")
            .select("*")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching projects:", error);
            return NextResponse.json(
                { error: "Failed to fetch projects" },
                { status: 500 },
            );
        }

        return NextResponse.json({ projects: projects || [] });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// POST /api/teams/[id]/projects - Create new project in team
export async function POST(
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

        const body = await request.json();
        const { name, description } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 },
            );
        }

        // Create project
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .insert({
                team_id: teamId,
                name: name.trim(),
                description: description?.trim() || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (projectError) {
            console.error("Error creating project:", projectError);
            return NextResponse.json(
                { error: "Failed to create project" },
                { status: 500 },
            );
        }

        // Add creator as project owner
        // Get user email from auth
        const userEmail = user.email || user.user_metadata?.email || "";
        
        if (!userEmail) {
            console.error("User email not found");
            return NextResponse.json(
                { error: "User email is required" },
                { status: 500 },
            );
        }

        const { error: memberError } = await supabase
            .from("project_members")
            .insert({
                project_id: project.id,
                user_id: user.id,
                role: "owner",
                is_online: false,
                full_name: user.user_metadata?.full_name || null,
                email: userEmail,
            });

        if (memberError) {
            console.error("Error adding project member:", memberError);
            console.error("Member error details:", JSON.stringify(memberError, null, 2));
            
            // If member addition fails, we should still return an error
            // because the project is incomplete without the owner
            return NextResponse.json(
                { 
                    error: "Failed to add project owner",
                    details: memberError.message,
                    code: memberError.code,
                    hint: memberError.hint
                },
                { status: 500 },
            );
        }

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
