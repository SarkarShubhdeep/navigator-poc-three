"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, User, Users } from "lucide-react";
import { TicketItem } from "./ticket-item";
import type { Ticket, ProjectMember } from "@/lib/mock-data/project";
import { useState } from "react";
import { Badge } from "../ui/badge";

interface WorkTicketsSectionProps {
    tickets: Ticket[];
    members: ProjectMember[];
    currentUserId: string;
    onTicketClick: (ticket: Ticket) => void;
    onStatusChange?: (ticketId: string, newStatus: Ticket["status"]) => void;
    onStartTicket?: (ticketId: string) => void;
    onPauseTicket?: (ticketId: string) => void;
    activeTicketId?: string | null;
    onCreateTicket?: () => void;
}

export function WorkTicketsSection({
    tickets,
    members,
    currentUserId,
    onTicketClick,
    onStatusChange,
    onStartTicket,
    onPauseTicket,
    activeTicketId,
    onCreateTicket,
}: WorkTicketsSectionProps) {
    const [viewMode, setViewMode] = useState<"all" | "my">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTickets = tickets.filter((ticket) => {
        const matchesView =
            viewMode === "all" || ticket.assignedToUserId === currentUserId;
        const matchesSearch =
            !searchQuery ||
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        return matchesView && matchesSearch;
    });

    return (
        <div className="border border-muted p-2 py-6 rounded-xl bg-muted/50">
            <div className="flex items-center justify-between px-4 pb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Work tickets </h2>
                    <Badge className="text-sm font-semibold font-mono rounded-full">
                        {filteredTickets.length}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8"
                        />
                    </div>
                    <Button
                        variant={viewMode === "all" ? "secondary" : "default"}
                        size="sm"
                        onClick={() =>
                            setViewMode(viewMode === "my" ? "all" : "my")
                        }
                        className="rounded-full border border-border/50"
                    >
                        {viewMode === "my" ? "My Tickets" : "All Tickets"}
                        {viewMode === "my" ? (
                            <User className="h-4 w-4" />
                        ) : (
                            <Users className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        onClick={() => onCreateTicket?.()}
                        size="sm"
                        variant="secondary"
                        className="rounded-full border border-border/50"
                        disabled={!onCreateTicket}
                    >
                        Create a new ticket
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                {filteredTickets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        No tickets found.
                    </p>
                ) : (
                    filteredTickets.map((ticket) => {
                        const assignedMember = members.find(
                            (m) => m.userId === ticket.assignedToUserId,
                        );
                        return (
                            <TicketItem
                                key={ticket.id}
                                ticket={ticket}
                                assignedMember={assignedMember}
                                currentUserId={currentUserId}
                                onTicketClick={onTicketClick}
                                onStatusChange={onStatusChange}
                                onStartTicket={onStartTicket}
                                onPauseTicket={onPauseTicket}
                                activeTicketId={activeTicketId}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
