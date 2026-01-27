"use client";

import { formatDurationHuman } from "@/lib/utils/time";
import type { Ticket } from "@/lib/mock-data/project";
import { useEffect, useState } from "react";

interface QuickStatsProps {
    tickets: Ticket[];
    currentUserId: string;
}

export function QuickStats({ tickets, currentUserId }: QuickStatsProps) {
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        setToday(todayDate);
    }, []);

    if (!today) {
        return (
            <div className="border border-muted bg-muted/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    // Calculate today's work duration for current user
    const todayWorkDuration = tickets.reduce((total, ticket) => {
        const todayLogs = ticket.workLogs.filter((log) => {
            const logDate = new Date(log.startTime);
            logDate.setHours(0, 0, 0, 0);
            return (
                logDate.getTime() === today.getTime() &&
                log.userId === currentUserId
            );
        });
        return total + todayLogs.reduce((sum, log) => sum + log.duration, 0);
    }, 0);

    // Calculate ticket counts
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const closedTickets = tickets.filter((t) => t.status === "close").length;
    const assignedToUserTickets = tickets.filter(
        (t) => t.assignedToUserId === currentUserId,
    ).length;

    // Calculate total team work duration
    const totalTeamDuration = tickets.reduce(
        (total, ticket) => total + ticket.totalDuration,
        0,
    );

    // Format today's work duration
    const todayMinutes = Math.floor(todayWorkDuration / 60);
    const todayHours = Math.floor(todayMinutes / 60);
    const todayMinutesRemainder = todayMinutes % 60;

    const todayWorkText =
        todayHours > 0
            ? `${todayHours} hour${todayHours > 1 ? "s" : ""} and ${todayMinutesRemainder} minute${todayMinutesRemainder !== 1 ? "s" : ""}`
            : `${todayMinutes} minute${todayMinutes !== 1 ? "s" : ""}`;

    // Format total team duration
    const totalHours = Math.floor(totalTeamDuration / 3600);
    const totalMinutes = Math.floor((totalTeamDuration % 3600) / 60);

    return (
        <div className="border border-muted bg-muted/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3 text-2xl">
                <p className="text-muted-foreground">
                    You worked for{" "}
                    <span className="text-foreground">{todayWorkText}</span>{" "}
                    today in total. That&apos;s 20% less than yesterday.
                </p>
                <p className="text-muted-foreground">
                    This team has{" "}
                    <span className="text-foreground">
                        {openTickets} open ticket{openTickets !== 1 ? "s" : ""}
                    </span>{" "}
                    and{" "}
                    <span className="text-foreground">
                        {closedTickets} closed ticket
                        {closedTickets !== 1 ? "s" : ""}
                    </span>
                    .
                </p>
                <p className="text-muted-foreground">
                    <span className="text-foreground">
                        {assignedToUserTickets} ticket
                        {assignedToUserTickets !== 1 ? "s" : ""}
                    </span>{" "}
                    {assignedToUserTickets === 1 ? "is" : "are"} assigned to
                    you.
                </p>
                <p className="text-muted-foreground">
                    The team logged a combined total of{" "}
                    <span className="text-foreground">
                        {totalHours} hour{totalHours !== 1 ? "s" : ""}
                    </span>{" "}
                    and{" "}
                    <span className="text-foreground">
                        {totalMinutes} minute{totalMinutes !== 1 ? "s" : ""}
                    </span>
                    .
                </p>
            </div>
        </div>
    );
}
