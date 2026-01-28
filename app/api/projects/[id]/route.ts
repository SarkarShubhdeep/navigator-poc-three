import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Force dynamic rendering

// GET /api/projects/[id] - Get project with members and tickets
export async function GET(
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

        // Get project first (without members to avoid RLS issues)
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", id)
            .single();

        if (projectError) {
            console.error("Error fetching project:", projectError);
            console.error("Project error details:", JSON.stringify(projectError, null, 2));
            
            // Check for RLS/permission errors
            if (projectError.code === "42501" || projectError.message?.includes("permission denied")) {
                return NextResponse.json(
                    { 
                        error: "Permission denied",
                        details: "RLS policy may be blocking access. Check your RLS policies.",
                        code: projectError.code,
                        hint: projectError.hint
                    },
                    { status: 403 },
                );
            }
            
            return NextResponse.json(
                { 
                    error: "Failed to fetch project",
                    details: projectError.message,
                    code: projectError.code,
                    hint: projectError.hint
                },
                { status: 500 },
            );
        }

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        // Get tickets with work logs
        const { data: tickets, error: ticketsError } = await supabase
            .from("tickets")
            .select(
                `
                *,
                work_logs(*)
            `,
            )
            .eq("project_id", id)
            .order("last_worked_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

        if (ticketsError) {
            console.error("Error fetching tickets:", ticketsError);
            return NextResponse.json(
                { error: "Failed to fetch tickets" },
                { status: 500 },
            );
        }

        // Get project members separately (to handle RLS properly)
        const { data: projectMembers, error: membersError } = await supabase
            .from("project_members")
            .select("*")
            .eq("project_id", id);

        if (membersError) {
            console.error("Error fetching project members:", membersError);
            console.error("Members error details:", JSON.stringify(membersError, null, 2));
            // Don't fail the entire request if members can't be fetched
            // This might happen if RLS blocks access
        }

        // If no members found and user is the project creator, add them as a fallback
        // This ensures the frontend always has at least one member to assign tickets to
        let finalMembers: Array<{ user_id: string; [key: string]: unknown }> =
            (projectMembers as Array<{ user_id: string; [key: string]: unknown }>) || [];
        if (finalMembers.length === 0 && project.created_by === user.id) {
            // Get user email from auth
            const userEmail = user.email || user.user_metadata?.email || "";
            if (userEmail) {
                finalMembers = [{
                    id: `fallback-${user.id}`,
                    project_id: project.id,
                    user_id: user.id,
                    role: "owner",
                    is_online: false,
                    joined_at: project.created_at,
                    full_name: user.user_metadata?.full_name || null,
                    email: userEmail,
                }];
            }
        }

        // Merge in team members who are not yet in project_members, so newly joined
        // team members appear in assign-to, ticket avatars, and team drawer
        const projectMemberUserIds = new Set(
            (finalMembers as { user_id: string }[]).map((m) => m.user_id),
        );
        if (project.team_id) {
            const { data: teamMembers, error: tmError } = await supabase
                .from("team_members")
                .select("id, user_id, full_name, email, joined_at")
                .eq("team_id", project.team_id);

            if (!tmError && teamMembers?.length) {
                for (const tm of teamMembers) {
                    if (projectMemberUserIds.has(tm.user_id)) continue;
                    projectMemberUserIds.add(tm.user_id);
                    finalMembers.push({
                        id: `tm-${tm.user_id}`,
                        project_id: project.id,
                        user_id: tm.user_id,
                        role: "member",
                        is_online: false,
                        joined_at: tm.joined_at ?? project.created_at,
                        full_name: tm.full_name ?? null,
                        email: tm.email ?? "",
                    });
                }
            }
        }

        return NextResponse.json({
            project: {
                ...project,
                project_members: finalMembers,
                tickets: tickets || [],
            },
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
