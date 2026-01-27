"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Archive,
    BarChart3,
    Briefcase,
    GanttChart,
    Plus,
    User,
    Video,
    Users,
    RefreshCw,
    AlertCircle,
    FolderKanban,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserFooter } from "./user-footer";
import { useEffect, useState } from "react";

interface Team {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
    team_id: string;
}

interface SidebarProps {
    isOpen: boolean;
    onUserUpdate?: () => void;
}

export function Sidebar({ isOpen, onUserUpdate }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [teams, setTeams] = useState<Team[]>([]);
    const [projectsByTeam, setProjectsByTeam] = useState<Record<string, Project[]>>({});
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isActive = (path: string) => pathname === path;

    const fetchTeams = async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);
        
        try {
            const response = await fetch("/api/teams", {
                cache: "no-store", // Ensure fresh data
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || `Failed to fetch teams (${response.status})`;
                console.error("Failed to fetch teams:", response.status, errorData);
                setError(errorMessage);
                setTeams([]);
                return;
            }
            
            const data = await response.json();
            const fetchedTeams = data.teams || [];
            setTeams(fetchedTeams);
            
            // Fetch projects for all teams
            const projectsMap: Record<string, Project[]> = {};
            await Promise.all(
                fetchedTeams.map(async (team: Team) => {
                    try {
                        const projectsResponse = await fetch(`/api/teams/${team.id}/projects`);
                        if (projectsResponse.ok) {
                            const projectsData = await projectsResponse.json();
                            projectsMap[team.id] = projectsData.projects || [];
                        }
                    } catch (err) {
                        console.error(`Error fetching projects for team ${team.id}:`, err);
                        projectsMap[team.id] = [];
                    }
                })
            );
            setProjectsByTeam(projectsMap);
            setError(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch teams";
            console.error("Error fetching teams:", error);
            setError(errorMessage);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    // Refresh teams when navigating to personal page, team page, or project navigator
    // This ensures teams are updated after creation/joining
    useEffect(() => {
        if (
            pathname === "/navigator/personal" ||
            pathname.startsWith("/navigator/team") ||
            pathname.startsWith("/navigator/project-navigator")
        ) {
            fetchTeams(false); // Don't show loading spinner on navigation refresh
        }
    }, [pathname]);

    const handleTeamClick = (teamId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Toggle expansion
        setExpandedTeams((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };

    const handleTeamNameClick = (teamId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Navigate to the team page
        router.push(`/navigator/team?id=${teamId}`);
    };

    const handleProjectClick = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/navigator/project-navigator?id=${projectId}`);
    };

    return (
        <aside
            className={`h-screen border-r bg-background flex flex-col ${
                isOpen ? "w-64" : "w-0 overflow-hidden"
            }`}
        >
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Teams Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Teams
                        </h2>
                        {!loading && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => fetchTeams()}
                                title="Refresh teams"
                            >
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <nav className="space-y-1">
                        <Link href="/navigator/personal">
                            <Button
                                variant={
                                    isActive("/navigator/personal")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <User className="mr-2 h-4 w-4" />
                                    Personal
                                </span>
                            </Button>
                        </Link>

                        {/* Display teams */}
                        {loading ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Loading teams...
                            </div>
                        ) : error ? (
                            <div className="px-2 py-2 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="flex-1 truncate">{error}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => fetchTeams()}
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Retry
                                </Button>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                                No teams yet
                            </div>
                        ) : (
                            teams.map((team) => {
                                // Check if this team is active (on team page with matching ID)
                                const currentTeamId = searchParams?.get("id");
                                const isTeamActive = pathname.startsWith("/navigator/team") && 
                                    currentTeamId === team.id;
                                const isExpanded = expandedTeams.has(team.id);
                                const projects = projectsByTeam[team.id] || [];
                                const currentProjectId = searchParams?.get("id");
                                const isOnProjectPage = pathname.startsWith("/navigator/project-navigator");
                                
                                return (
                                    <div key={team.id} className="space-y-1">
                                        <div className="flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 mr-1"
                                                onClick={(e) => handleTeamClick(team.id, e)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <Button
                                                variant={isTeamActive ? "secondary" : "ghost"}
                                                className="flex-1 justify-start"
                                                onClick={(e) => handleTeamNameClick(team.id, e)}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                <span className="truncate">{team.name}</span>
                                            </Button>
                                        </div>
                                        {isExpanded && projects.length > 0 && (
                                            <div className="ml-7 space-y-1">
                                                {projects.map((project) => {
                                                    const isProjectActive = isOnProjectPage && 
                                                        currentProjectId === project.id;
                                                    return (
                                                        <Button
                                                            key={project.id}
                                                            variant={isProjectActive ? "secondary" : "ghost"}
                                                            className="w-full justify-start text-sm"
                                                            onClick={(e) => handleProjectClick(project.id, e)}
                                                        >
                                                            <FolderKanban className="mr-2 h-3 w-3" />
                                                            <span className="truncate">{project.name}</span>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        <Link href="/navigator/add-team">
                            <Button
                                variant={
                                    isActive("/navigator/add-team")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start text-muted-foreground"
                                asChild
                            >
                                <span>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add new team
                                </span>
                            </Button>
                        </Link>
                    </nav>
                </div>

                <Separator />

                {/* Views Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Views
                    </h2>
                    <nav className="space-y-1">
                        <Link href="/navigator/timeline">
                            <Button
                                variant={
                                    isActive("/navigator/timeline")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <GanttChart className="mr-2 h-4 w-4" />
                                    Timeline
                                </span>
                            </Button>
                        </Link>
                        <Link href="/navigator/statistics">
                            <Button
                                variant={
                                    isActive("/navigator/statistics")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Statistics
                                </span>
                            </Button>
                        </Link>
                        <Link href="/navigator/agent-jerry">
                            <Button
                                variant={
                                    isActive("/navigator/agent-jerry")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span className="flex items-center">
                                    <Image
                                        src="/assets/agent-jerry-avatar.svg"
                                        alt="Agent Jerry"
                                        width={16}
                                        height={16}
                                        className="mr-2"
                                    />
                                    Agent Jerry
                                </span>
                            </Button>
                        </Link>
                        <Link href="/navigator/work-sessions">
                            <Button
                                variant={
                                    isActive("/navigator/work-sessions")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    Work Sessions
                                </span>
                            </Button>
                        </Link>
                        <Link href="/navigator/recordings">
                            <Button
                                variant={
                                    isActive("/navigator/recordings")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <Video className="mr-2 h-4 w-4" />
                                    Recordings
                                </span>
                            </Button>
                        </Link>
                        <Link href="/navigator/archived">
                            <Button
                                variant={
                                    isActive("/navigator/archived")
                                        ? "secondary"
                                        : "ghost"
                                }
                                className="w-full justify-start"
                                asChild
                            >
                                <span>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archived
                                </span>
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Custom View
                        </Button>
                    </nav>
                </div>
            </div>

            {/* Fixed User Footer */}
            <div className="p-2 border-t">
                <UserFooter onUserUpdate={onUserUpdate} />
            </div>
        </aside>
    );
}
