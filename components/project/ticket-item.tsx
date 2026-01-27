"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    TimerIcon,
    TimerDisplay,
    TimerRoot,
    useTimer,
} from "@/components/ui/timer";
import { Play, Pause } from "lucide-react";
import { getUserInitials } from "@/lib/utils/user";
import { formatDateTimeRange } from "@/lib/utils/time";
import type { Ticket, ProjectMember } from "@/lib/mock-data/project";
import { useState } from "react";

function DurationTimer({
    duration,
    isActive,
}: {
    duration: number;
    isActive?: boolean;
}) {
    const { formattedTime } = useTimer({
        loading: isActive || false,
        format: "HH:MM:SS",
        initialElapsedTime: duration,
    });

    return (
        <TimerRoot variant="outline" size="sm">
            <TimerIcon size="sm" loading={isActive || false} />
            <TimerDisplay size="sm" time={formattedTime.display} />
        </TimerRoot>
    );
}

interface TicketItemProps {
    ticket: Ticket;
    assignedMember?: ProjectMember;
    currentUserId: string;
    onTicketClick: (ticket: Ticket) => void;
    onStatusChange?: (ticketId: string, newStatus: Ticket["status"]) => void;
    onStartTicket?: (ticketId: string) => void;
    onPauseTicket?: (ticketId: string) => void;
    activeTicketId?: string | null;
}

export function TicketItem({
    ticket,
    assignedMember,
    currentUserId,
    onTicketClick,
    onStatusChange,
    onStartTicket,
    onPauseTicket,
    activeTicketId,
}: TicketItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isAssignedToMe = ticket.assignedToUserId === currentUserId;
    const canStart = ticket.status === "open" && isAssignedToMe;
    const isActive = activeTicketId === ticket.id;
    const showPauseButton = isActive;

    const handleStartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canStart) {
            onStartTicket?.(ticket.id);
        }
    };

    const handlePauseClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActive) {
            onPauseTicket?.(ticket.id);
        }
    };

    const lastWorkLog = ticket.workLogs[ticket.workLogs.length - 1];
    const lastWorkedText = lastWorkLog
        ? formatDateTimeRange(lastWorkLog.startTime, lastWorkLog.endTime)
        : null;

    return (
        <div
            className="p-4 rounded-lg border border-muted bg-muted hover:bg-accent/50 hover:border-border cursor-pointer transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onTicketClick(ticket)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium truncate">
                            {ticket.title}
                        </h3>

                        <Badge
                            className={`text-xs uppercase rounded-full ${
                                ticket.status === "open"
                                    ? "bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300"
                                    : ticket.status === "close"
                                      ? "bg-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300"
                                      : "bg-red-300 text-red-900 dark:bg-red-900 dark:text-red-300"
                            }`}
                        >
                            {ticket.status}
                        </Badge>
                        <Badge
                            className={`text-xs uppercase rounded-full ${
                                ticket.priority === "low"
                                    ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-300"
                                    : ticket.priority === "medium"
                                      ? "bg-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300"
                                      : "bg-red-300 text-red-900 dark:bg-red-900 dark:text-red-300"
                            }`}
                        >
                            {ticket.priority}
                        </Badge>
                    </div>

                    {ticket.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                            {ticket.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {assignedMember && (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-muted text-xs font-mono">
                                        {getUserInitials(
                                            assignedMember.fullName,
                                        ) ||
                                            assignedMember.email
                                                .substring(0, 2)
                                                .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span>
                                    {isAssignedToMe
                                        ? "Me"
                                        : assignedMember.fullName ||
                                          assignedMember.email}
                                </span>
                            </div>
                        )}
                        {lastWorkedText && (
                            <span>Last worked on: {lastWorkedText}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DurationTimer
                        duration={ticket.totalDuration}
                        isActive={isActive}
                    />
                    {showPauseButton ? (
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onClick={handlePauseClick}
                        >
                            <Pause className="h-4 w-4" fill="currentColor" />
                        </Button>
                    ) : (
                        canStart &&
                        isHovered && (
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                onClick={handleStartClick}
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
