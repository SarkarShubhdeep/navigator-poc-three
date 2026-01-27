"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Plus, FolderKanban } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/utils/cache";

interface Team {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
    created_by: string;
}

interface Project {
    id: string;
    name: string;
    description: string | null;
    team_id: string;
    created_at: string;
    created_by: string;
}

function TeamPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const teamId = searchParams.get("id");

    const [team, setTeam] = useState<Team | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchTeamData = useCallback(async (useCache = true) => {
        if (!teamId) {
            setLoading(false);
            setError("No team ID provided");
            return;
        }

        const cacheKey = `team_${teamId}`;
        
        // Try to load from cache first
        if (useCache) {
            const cached = getCachedData<{ team: Team; projects: Project[] }>(cacheKey);
            if (cached) {
                setTeam(cached.team);
                setProjects(cached.projects);
                setLoading(false);
                setError(null);
                // Continue to fetch fresh data in background
            }
        }

        try {
            const response = await fetch(`/api/teams/${teamId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch team");
            }

            const data = await response.json();
            const projectsList = data.projects || [];
            
            // Update state
            setTeam(data.team);
            setProjects(projectsList);
            setError(null);
            
            // Cache the data
            setCachedData(cacheKey, {
                team: data.team,
                projects: projectsList,
            });
        } catch (error) {
            console.error("Error fetching team:", error);
            // If we have cached data, keep showing it
            if (!getCachedData(cacheKey)) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch team",
                );
            }
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchTeamData();
    }, [fetchTeamData]);

    const handleProjectClick = (projectId: string) => {
        router.push(`/navigator/project-navigator?id=${projectId}`);
    };

    const handleCreateProject = async () => {
        if (!projectName.trim() || !teamId) return;

        setCreating(true);
        
        // Optimistic update - add project immediately
        const optimisticProject: Project = {
            id: `temp-${Date.now()}`,
            name: projectName.trim(),
            description: projectDescription.trim() || null,
            team_id: teamId,
            created_at: new Date().toISOString(),
            created_by: "", // Will be updated from server
        };
        
        const previousProjects = projects;
        setProjects((prev) => [optimisticProject, ...prev]);
        
        // Invalidate cache so fresh data is fetched
        invalidateCache(`team_${teamId}`);

        try {
            const response = await fetch(`/api/teams/${teamId}/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName.trim(),
                    description: projectDescription.trim() || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create project");
            }

            const data = await response.json();
            const newProject = data.project;

            // Replace optimistic project with real one
            setProjects((prev) => {
                const filtered = prev.filter((p) => p.id !== optimisticProject.id);
                return [newProject, ...filtered];
            });

            // Update cache
            setCachedData(`team_${teamId}`, {
                team: team!,
                projects: [newProject, ...previousProjects],
            });

            // Reset form and close drawer
            setProjectName("");
            setProjectDescription("");
            setIsCreateProjectOpen(false);

            // Navigate to the new project
            router.push(`/navigator/project-navigator?id=${newProject.id}`);
        } catch (error) {
            console.error("Error creating project:", error);
            
            // Revert optimistic update on error
            setProjects(previousProjects);
            
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create project",
            );
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading team...</p>
            </div>
        );
    }

    if (error || !team) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-destructive mb-2">
                        {error || "Team not found"}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/navigator/personal")}
                    >
                        Go back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pt-0 flex flex-col h-full">
            {/* Team Header */}
            <div className="flex items-center justify-between py-6">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Team</p>
                    <h1 className="text-3xl font-bold">{team.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsCreateProjectOpen(true)}
                        className="rounded-full font-semibold"
                    >
                        Create Project
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Projects Section */}
            <div>
                <div className="flex items-center gap-2 my-4">
                    <FolderKanban className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <Badge className="text-sm font-mono font-semibold rounded-full">
                        {projects.length}
                    </Badge>
                </div>

                {projects.length === 0 ? (
                    <div className="border border-muted bg-muted/50 rounded-xl p-12 text-center">
                        <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No projects yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get started by creating your first project
                        </p>
                        <Button
                            onClick={() => setIsCreateProjectOpen(true)}
                            variant="secondary"
                            className="rounded-full border border-border/50"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {projects.map((project) => (
                            <Card
                                key={project.id}
                                className="cursor-pointer hover:bg-accent/50 hover:border-border transition-colors flex flex-col justify-between"
                                onClick={() => handleProjectClick(project.id)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">
                                            {project.name}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="">
                                    {project.description && (
                                        <CardDescription className="line-clamp-2">
                                            {project.description}
                                        </CardDescription>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Drawer */}
            <Sheet
                open={isCreateProjectOpen}
                onOpenChange={setIsCreateProjectOpen}
            >
                <SheetContent className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-semibold">
                                Create New Project
                            </SheetTitle>
                            <SheetClose asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-1">
                            <Label
                                htmlFor="project-name"
                                className="text-muted-foreground"
                            >
                                Project Name
                            </Label>
                            <Input
                                id="project-name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Enter project name"
                                className="text-lg font-semibold"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <Label
                                htmlFor="project-description"
                                className="text-muted-foreground"
                            >
                                Description (Optional)
                            </Label>
                            <textarea
                                id="project-description"
                                placeholder="Add a description..."
                                value={projectDescription}
                                onChange={(e) =>
                                    setProjectDescription(e.target.value)
                                }
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateProjectOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateProject}
                                disabled={!projectName.trim() || creating}
                            >
                                {creating ? "Creating..." : "Create Project"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default function TeamPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 pt-0 flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            }
        >
            <TeamPageContent />
        </Suspense>
    );
}
