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
    mockProject,
    CURRENT_USER_ID,
    type Ticket,
    type WorkLog,
} from "@/lib/mock-data/project";
import { useState, useRef } from "react";

export default function ProjectNavigatorPage() {
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    const [tickets, setTickets] = useState(mockProject.tickets);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [isWorkLogDialogOpen, setIsWorkLogDialogOpen] = useState(false);
    const timerStartTimeRef = useRef<Date | null>(null);

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDrawerOpen(true);
    };

    const handleTicketUpdate = (updatedTicket: Ticket) => {
        setTickets((prev) =>
            prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
        );
        setSelectedTicket(updatedTicket);
    };

    const handleStatusChange = (
        ticketId: string,
        newStatus: Ticket["status"],
    ) => {
        setTickets((prev) =>
            prev.map((t) =>
                t.id === ticketId ? { ...t, status: newStatus } : t,
            ),
        );
    };

    const handleStartTicket = (ticketId: string) => {
        // Stop any existing timer
        if (activeTicketId && activeTicketId !== ticketId) {
            handlePauseTicket(activeTicketId);
        }

        const startTime = new Date();
        setActiveTicketId(ticketId);
        timerStartTimeRef.current = startTime;
        setTickets((prev) =>
            prev.map((t) =>
                t.id === ticketId ? { ...t, status: "active" as const } : t,
            ),
        );
    };

    const handlePauseTicket = (ticketId: string) => {
        if (activeTicketId === ticketId && timerStartTimeRef.current) {
            setIsWorkLogDialogOpen(true);
        }
    };

    const handleWorkLogSave = (description: string) => {
        if (!activeTicketId || !timerStartTimeRef.current) return;

        const endTime = new Date();
        const duration = Math.floor(
            (endTime.getTime() - timerStartTimeRef.current.getTime()) / 1000,
        );

        const newWorkLog: WorkLog = {
            id: `work-${Date.now()}`,
            ticketId: activeTicketId,
            userId: CURRENT_USER_ID,
            startTime: timerStartTimeRef.current,
            endTime,
            duration,
            description: description.trim() || undefined,
        };

        setTickets((prev) =>
            prev.map((t) => {
                if (t.id === activeTicketId) {
                    const updatedTicket = {
                        ...t,
                        workLogs: [...t.workLogs, newWorkLog],
                        totalDuration: t.totalDuration + duration,
                        lastWorkedOn: endTime,
                        status: "open" as const,
                    };
                    if (selectedTicket?.id === activeTicketId) {
                        setSelectedTicket(updatedTicket);
                    }
                    return updatedTicket;
                }
                return t;
            }),
        );

        // Reset timer
        setActiveTicketId(null);
        timerStartTimeRef.current = null;
    };

    const handleWorkLogSkip = () => {
        if (!activeTicketId || !timerStartTimeRef.current) return;

        const endTime = new Date();
        const duration = Math.floor(
            (endTime.getTime() - timerStartTimeRef.current.getTime()) / 1000,
        );

        const newWorkLog: WorkLog = {
            id: `work-${Date.now()}`,
            ticketId: activeTicketId,
            userId: CURRENT_USER_ID,
            startTime: timerStartTimeRef.current,
            endTime,
            duration,
        };

        setTickets((prev) =>
            prev.map((t) => {
                if (t.id === activeTicketId) {
                    const updatedTicket = {
                        ...t,
                        workLogs: [...t.workLogs, newWorkLog],
                        totalDuration: t.totalDuration + duration,
                        lastWorkedOn: endTime,
                        status: "open" as const,
                    };
                    if (selectedTicket?.id === activeTicketId) {
                        setSelectedTicket(updatedTicket);
                    }
                    return updatedTicket;
                }
                return t;
            }),
        );

        // Reset timer
        setActiveTicketId(null);
        timerStartTimeRef.current = null;
    };

    const handleWorkLogCancel = () => {
        // Just close dialog, timer continues running
        setIsWorkLogDialogOpen(false);
    };

    const getElapsedTime = (): number => {
        if (!timerStartTimeRef.current) return 0;
        return Math.floor(
            (new Date().getTime() - timerStartTimeRef.current.getTime()) / 1000,
        );
    };

    const handleCreateTicket = (ticketData: {
        title: string;
        description: string;
        priority: Ticket["priority"];
        assignedToUserId: string;
        status: "open" | "close";
    }) => {
        const newTicket: Ticket = {
            id: `ticket-${Date.now()}`,
            projectId: mockProject.id,
            title: ticketData.title,
            description: ticketData.description,
            status: ticketData.status,
            assignedToUserId: ticketData.assignedToUserId,
            priority: ticketData.priority,
            totalDuration: 0,
            workLogs: [],
        };

        setTickets((prev) => [...prev, newTicket]);
        setIsCreateDrawerOpen(false);
    };

    return (
        <div className="p-8 pt-0 flex flex-col h-full">
            <ProjectHeader
                projectName={mockProject.name}
                members={mockProject.members}
                currentUserId={CURRENT_USER_ID}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    <LiveClock />
                    <WorkTicketsSection
                        tickets={tickets}
                        members={mockProject.members}
                        currentUserId={CURRENT_USER_ID}
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
                            currentUserId={CURRENT_USER_ID}
                        />
                    </div>
                </div>
            </div>

            <TicketDrawer
                ticket={selectedTicket}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                members={mockProject.members}
                currentUserId={CURRENT_USER_ID}
                onUpdate={handleTicketUpdate}
            />

            <CreateTicketDrawer
                open={isCreateDrawerOpen}
                onOpenChange={setIsCreateDrawerOpen}
                members={mockProject.members}
                currentUserId={CURRENT_USER_ID}
                projectId={mockProject.id}
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
