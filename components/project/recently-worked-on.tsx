"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    TimerIcon,
    TimerDisplay,
    TimerRoot,
    useTimer,
} from "@/components/ui/timer";
import { Play, Pause } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/time";
import type { Ticket } from "@/lib/mock-data/project";
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
        <TimerRoot variant="ghost" size="sm" className="p-0 h-auto">
            <TimerIcon size="sm" loading={isActive || false} />
            <TimerDisplay size="sm" time={formattedTime.display} />
        </TimerRoot>
    );
}

interface RecentlyWorkedOnProps {
    tickets: Ticket[];
    onTicketClick?: (ticket: Ticket) => void;
    onStartTicket?: (ticketId: string) => void;
    onPauseTicket?: (ticketId: string) => void;
    activeTicketId?: string | null;
}

export function RecentlyWorkedOn({
    tickets,
    onTicketClick,
    onStartTicket,
    onPauseTicket,
    activeTicketId,
}: RecentlyWorkedOnProps) {
    // Get 4 most recently worked on tickets
    const recentTickets = tickets
        .filter((ticket) => ticket.lastWorkedOn)
        .sort(
            (a, b) =>
                (b.lastWorkedOn?.getTime() || 0) -
                (a.lastWorkedOn?.getTime() || 0),
        )
        .slice(0, 4);

    if (recentTickets.length === 0) {
        return (
            <div className="border border-muted flex-1 bg-muted/50 rounded-xl p-6 pb-2">
                <h2 className="text-xl font-semibold mb-2">
                    Recently Worked On
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Quicky start your recent ticket
                </p>
                <p className="text-sm text-muted-foreground">
                    No recent work found.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-muted bg-muted/50 rounded-xl group/recently-worked-on">
            <div className="flex flex-col px-6 py-6">
                <h2 className="text-xl font-semibold">Recently Worked On</h2>
                <p className="text-sm text-muted-foreground">
                    Quicky start your recent ticket
                </p>
            </div>
            <div className="relative pb-2">
                <Carousel className="w-full">
                    <CarouselContent className="mx-0">
                        {recentTickets.map((ticket) => (
                            <CarouselItem
                                key={ticket.id}
                                className="pl-2 basis-full sm:basis-[45%]"
                            >
                                <RecentTicketCard
                                    ticket={ticket}
                                    onTicketClick={onTicketClick}
                                    onStartTicket={onStartTicket}
                                    onPauseTicket={onPauseTicket}
                                    activeTicketId={activeTicketId}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {recentTickets.length > 1 && (
                        <div className="group-hover/recently-worked-on:opacity-100 opacity-0 transition-opacity duration-300">
                            <CarouselPrevious className="left-2 z-10" />
                            <CarouselNext className="right-2 z-10" />
                        </div>
                    )}
                </Carousel>
            </div>
        </div>
    );
}

interface RecentTicketCardProps {
    ticket: Ticket;
    onTicketClick?: (ticket: Ticket) => void;
    onStartTicket?: (ticketId: string) => void;
    onPauseTicket?: (ticketId: string) => void;
    activeTicketId?: string | null;
}

function RecentTicketCard({
    ticket,
    onTicketClick,
    onStartTicket,
    onPauseTicket,
    activeTicketId,
}: RecentTicketCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const canStart = ticket.status === "open";
    const isActive = activeTicketId === ticket.id;
    const showPauseButton = isActive;

    const lastWorkLog = ticket.workLogs[ticket.workLogs.length - 1];
    const lastWorkedDate = lastWorkLog
        ? lastWorkLog.endTime
        : ticket.lastWorkedOn || new Date();

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

    const handleCardClick = () => {
        onTicketClick?.(ticket);
    };

    return (
        <div
            className="p-4 rounded-lg border border-muted bg-muted/80 hover:bg-accent/50 hover:border-border cursor-pointer relative h-56 flex flex-col justify-between"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
        >
            <div className="flex flex-col">
                <h3 className="text-base font-medium mb-3 line-clamp-2">
                    {ticket.title}
                </h3>

                <div className="space-y-2 mb-4">
                    {lastWorkedDate && (
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Last worked
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                                {formatDate(lastWorkedDate)},{" "}
                                {formatTime(lastWorkedDate)}
                            </p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs text-muted-foreground">
                            Total duration
                        </p>
                        <DurationTimer
                            duration={ticket.totalDuration}
                            isActive={isActive}
                        />
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
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
            </div>
            {showPauseButton ? (
                <Button
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 absolute bottom-2 right-2"
                    onClick={handlePauseClick}
                >
                    <Pause className="h-5 w-5" fill="currentColor" />
                </Button>
            ) : (
                canStart &&
                isHovered && (
                    <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 absolute bottom-2 right-2"
                        onClick={handleStartClick}
                    >
                        <Play className="h-5 w-5" fill="currentColor" />
                    </Button>
                )
            )}
        </div>
    );
}
