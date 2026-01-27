"use client";

import { ProjectHeader } from "@/components/project/project-header";
import { LiveClock } from "@/components/project/live-clock";
import { QuickStats } from "@/components/project/quick-stats";
import { RecentlyWorkedOn } from "@/components/project/recently-worked-on";
import { TicketDrawer } from "@/components/project/ticket-drawer";
import { CreateTicketDrawer } from "@/components/project/create-ticket-drawer";
import { WorkTicketsSection } from "@/components/project/work-tickets-section";
import { WorkLogDialog } from "@/components/project/work-log-dialog";
import {
    type Ticket,
    type ProjectMember,
    type Project,
} from "@/lib/mock-data/project";
import {
    transformTicket,
    transformProjectMember,
} from "@/lib/utils/supabase-types";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ProjectNavigatorContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get("id") || "default"; // TODO: Get from URL or context
    const supabase = createClient();

    const [project, setProject] = useState<Project | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [isWorkLogDialogOpen, setIsWorkLogDialogOpen] = useState(false);
    const [hasActiveWorkSession, setHasActiveWorkSession] = useState(false);
    const [pendingTicketId, setPendingTicketId] = useState<string | null>(null); // Ticket to start after work log dialog closes
    const timerStartTimeRef = useRef<Date | null>(null);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchUser();
    }, [supabase]);

    // Fetch project data
    useEffect(() => {
        if (!projectId || projectId === "default") {
            setLoading(false);
            return;
        }

        const fetchProject = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}`);
                
                if (!response.ok) {
                    // Try to get error details from response
                    let errorMessage = "Failed to fetch project";
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.details || errorData.error || errorMessage;
                        console.error("Project fetch error:", errorData);
                    } catch {
                        // If JSON parsing fails, use status text
                        errorMessage = response.statusText || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                const projectData = data.project;

                let transformedMembers: ProjectMember[] = (
                    projectData.project_members || []
                ).map(transformProjectMember);

                // If no members found (RLS issue or empty), add current user as fallback
                // This ensures the "Assigned to" dropdown always has at least one option
                if (transformedMembers.length === 0) {
                    // Get user info from Supabase
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    
                    if (user) {
                        transformedMembers = [{
                            userId: user.id,
                            email: user.email || "",
                            fullName: user.user_metadata?.full_name || undefined,
                            isOnline: false,
                        }];
                    }
                }

                const transformedTickets: Ticket[] = (
                    projectData.tickets || []
                ).map(transformTicket);

                setProject({
                    id: projectData.id,
                    name: projectData.name,
                    members: transformedMembers,
                    tickets: transformedTickets,
                    teamId: projectData.team_id, // Store team_id for invite functionality
                });

                setTickets(transformedTickets);
            } catch (error) {
                console.error("Error fetching project:", error);
                // Show error to user
                alert(
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch project. Please check the console for details."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, supabase]);

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDrawerOpen(true);
    };

    const handleTicketUpdate = async (updatedTicket: Ticket) => {
        try {
            const response = await fetch(`/api/tickets/${updatedTicket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: updatedTicket.title,
                    description: updatedTicket.description,
                    status: updatedTicket.status,
                    priority: updatedTicket.priority,
                    assignedToUserId: updatedTicket.assignedToUserId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update ticket");
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            setTickets((prev) =>
                prev.map((t) =>
                    t.id === transformedTicket.id ? transformedTicket : t,
                ),
            );
            setSelectedTicket(transformedTicket);
        } catch (error) {
            console.error("Error updating ticket:", error);
        }
    };

    const handleStatusChange = async (
        ticketId: string,
        newStatus: Ticket["status"],
    ) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update ticket status");
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            setTickets((prev) =>
                prev.map((t) =>
                    t.id === transformedTicket.id ? transformedTicket : t,
                ),
            );
        } catch (error) {
            console.error("Error updating ticket status:", error);
        }
    };

    const handleStartTicket = async (ticketId: string) => {
        if (!hasActiveWorkSession) {
            alert("You must clock in before working on tickets");
            return;
        }

        // If there's an active ticket, pause it and show work log dialog first
        if (activeTicketId && activeTicketId !== ticketId) {
            // Store the ticket we want to start after the dialog closes
            setPendingTicketId(ticketId);
            // Show work log dialog (not silent)
            setIsWorkLogDialogOpen(true);
            return; // Don't start new ticket yet, wait for dialog to close
        }

        // No active ticket, start immediately
        try {
            const response = await fetch(`/api/tickets/${ticketId}/start`, {
                method: "POST",
            });

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = "Failed to start ticket";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.details || errorData.error || errorMessage;
                    console.error("Ticket start error:", errorData);
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            const startTime = new Date(data.workLog.start_time);
            setActiveTicketId(ticketId);
            timerStartTimeRef.current = startTime;

            setTickets((prev) =>
                prev.map((t) =>
                    t.id === transformedTicket.id ? transformedTicket : t,
                ),
            );
        } catch (error) {
            console.error("Error starting ticket:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to start ticket work",
            );
        }
    };

    // Start the pending ticket after work log dialog closes
    const startPendingTicket = async () => {
        if (!pendingTicketId) return;

        const ticketIdToStart = pendingTicketId;
        setPendingTicketId(null); // Clear pending before starting

        try {
            const response = await fetch(`/api/tickets/${ticketIdToStart}/start`, {
                method: "POST",
            });

            if (!response.ok) {
                let errorMessage = "Failed to start ticket";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.details || errorData.error || errorMessage;
                    console.error("Ticket start error:", errorData);
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            const startTime = new Date(data.workLog.start_time);
            setActiveTicketId(ticketIdToStart);
            timerStartTimeRef.current = startTime;

            setTickets((prev) =>
                prev.map((t) =>
                    t.id === transformedTicket.id ? transformedTicket : t,
                ),
            );
        } catch (error) {
            console.error("Error starting pending ticket:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to start ticket work",
            );
        }
    };

    const handlePauseTicket = async (
        ticketId: string,
        silent = false,
    ) => {
        if (activeTicketId === ticketId && timerStartTimeRef.current) {
            if (!silent) {
                setIsWorkLogDialogOpen(true);
            } else {
                // Silent pause - skip work log
                await pauseTicketWork(ticketId, "");
            }
        }
    };

    const pauseTicketWork = async (ticketId: string, description: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/pause`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || "Failed to pause ticket";
                console.error("Pause ticket error:", errorMessage, errorData);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            setTickets((prev) =>
                prev.map((t) =>
                    t.id === transformedTicket.id ? transformedTicket : t,
                ),
            );

            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(transformedTicket);
            }

            // Reset timer
            setActiveTicketId(null);
            timerStartTimeRef.current = null;
        } catch (error) {
            console.error("Error pausing ticket:", error);
        }
    };

    const handleWorkLogSave = async (description: string) => {
        if (!activeTicketId) return;
        await pauseTicketWork(activeTicketId, description);
        setIsWorkLogDialogOpen(false);
        // Start pending ticket if there is one
        if (pendingTicketId) {
            await startPendingTicket();
        }
    };

    const handleWorkLogSkip = async () => {
        if (!activeTicketId) return;
        await pauseTicketWork(activeTicketId, "");
        setIsWorkLogDialogOpen(false);
        // Start pending ticket if there is one
        if (pendingTicketId) {
            await startPendingTicket();
        }
    };

    const handleWorkLogCancel = () => {
        // Cancel starting the new ticket
        setPendingTicketId(null);
        // Just close dialog, timer continues running
        setIsWorkLogDialogOpen(false);
    };

    const getElapsedTime = (): number => {
        if (!timerStartTimeRef.current) return 0;
        return Math.floor(
            (new Date().getTime() - timerStartTimeRef.current.getTime()) / 1000,
        );
    };

    const handleCreateTicket = async (ticketData: {
        title: string;
        description: string;
        priority: Ticket["priority"];
        assignedToUserId: string;
        status: "open" | "close";
    }) => {
        try {
            const response = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: projectId,
                    title: ticketData.title,
                    description: ticketData.description,
                    priority: ticketData.priority,
                    assignedToUserId: ticketData.assignedToUserId,
                    status: ticketData.status,
                }),
            });

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = "Failed to create ticket";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.details || errorData.error || errorMessage;
                    console.error("Ticket creation error:", errorData);
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const transformedTicket = transformTicket(data.ticket);

            setTickets((prev) => [...prev, transformedTicket]);
            setIsCreateDrawerOpen(false);
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create ticket. Please check the console for details."
            );
        }
    };

    if (loading || !project || !currentUserId) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading project...</p>
            </div>
        );
    }

    return (
        <div className="p-8 pt-0 flex flex-col h-full">
            <ProjectHeader
                projectName={project.name}
                members={project.members}
                currentUserId={currentUserId}
                teamId={project.teamId}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    <LiveClock
                        projectId={projectId}
                        onWorkSessionChange={setHasActiveWorkSession}
                    />
                    <WorkTicketsSection
                        tickets={tickets}
                        members={project.members}
                        currentUserId={currentUserId}
                        onTicketClick={handleTicketClick}
                        onStatusChange={handleStatusChange}
                        onStartTicket={handleStartTicket}
                        onPauseTicket={handlePauseTicket}
                        activeTicketId={activeTicketId}
                        onCreateTicket={() => setIsCreateDrawerOpen(true)}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-4 h-full flex flex-col min-h-0">
                    <RecentlyWorkedOn
                        tickets={tickets}
                        onTicketClick={handleTicketClick}
                        onStartTicket={handleStartTicket}
                        onPauseTicket={handlePauseTicket}
                        activeTicketId={activeTicketId}
                    />

                    <div className="flex-shrink-0">
                        <QuickStats
                            tickets={tickets}
                            currentUserId={currentUserId}
                        />
                    </div>
                </div>
            </div>

            <TicketDrawer
                ticket={selectedTicket}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                members={project.members}
                currentUserId={currentUserId}
                onUpdate={handleTicketUpdate}
            />

            <CreateTicketDrawer
                open={isCreateDrawerOpen}
                onOpenChange={setIsCreateDrawerOpen}
                members={project.members}
                currentUserId={currentUserId}
                projectId={projectId}
                onCreate={handleCreateTicket}
            />

            {activeTicketId && timerStartTimeRef.current && (
                <WorkLogDialog
                    open={isWorkLogDialogOpen}
                    onOpenChange={setIsWorkLogDialogOpen}
                    onSave={handleWorkLogSave}
                    onSkip={handleWorkLogSkip}
                    onCancel={handleWorkLogCancel}
                    duration={getElapsedTime()}
                    getElapsedTime={getElapsedTime}
                />
            )}
        </div>
    );
}

export default function ProjectNavigatorPage() {
    return (
        <Suspense fallback={
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <ProjectNavigatorContent />
        </Suspense>
    );
}
