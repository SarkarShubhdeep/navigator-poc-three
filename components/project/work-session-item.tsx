"use client";

import { Badge } from "@/components/ui/badge";
import {
    TimerIcon,
    TimerDisplay,
    TimerRoot,
    useTimer,
} from "@/components/ui/timer";
import { formatDateTimeRange, formatDateLong } from "@/lib/utils/time";
import type { WorkSession } from "@/lib/mock-data/project";
import { useActiveWorkSession } from "@/hooks/use-active-work-session";
import { useEffect, useState } from "react";

function DurationTimer({
    duration,
    isActive,
    clockInTime,
}: {
    duration: number;
    isActive?: boolean;
    clockInTime?: Date;
}) {
    const { activeSession, elapsedTime: sharedElapsedTime } =
        useActiveWorkSession();
    const [currentElapsedTime, setCurrentElapsedTime] = useState(duration);

    // For active sessions, sync with shared elapsed time or calculate from clock_in_time
    useEffect(() => {
        if (isActive && clockInTime) {
            // Check if this is the active session from the shared hook
            if (
                activeSession &&
                Math.abs(
                    activeSession.clockInTime.getTime() -
                        clockInTime.getTime(),
                ) < 1000
            ) {
                // Use shared elapsed time for consistency across pages
                setCurrentElapsedTime(sharedElapsedTime);
            } else {
                // Calculate locally if not matching shared session
                const calculateElapsed = () => {
                    const now = new Date();
                    const elapsed = Math.floor(
                        (now.getTime() - clockInTime.getTime()) / 1000,
                    );
                    setCurrentElapsedTime(elapsed);
                };
                calculateElapsed();
                const interval = setInterval(calculateElapsed, 1000);
                return () => clearInterval(interval);
            }
        } else {
            // For completed sessions, use the static duration
            setCurrentElapsedTime(duration);
        }
    }, [
        isActive,
        clockInTime,
        duration,
        activeSession,
        sharedElapsedTime,
    ]);

    const { formattedTime, reset } = useTimer({
        loading: isActive || false,
        format: "HH:MM:SS",
        initialElapsedTime: currentElapsedTime,
        resetOnLoadingChange: false, // Don't reset when switching pages
    });

    // Update timer when elapsed time changes significantly (e.g., when switching pages)
    // Only reset if the difference is more than 5 seconds to avoid constant resets
    useEffect(() => {
        if (isActive && Math.abs(currentElapsedTime - duration) > 5) {
            reset();
        }
    }, [currentElapsedTime, isActive, duration, reset]);

    return (
        <TimerRoot variant="outline" size="sm">
            <TimerIcon size="sm" loading={isActive || false} />
            <TimerDisplay size="sm" time={formattedTime.display} />
        </TimerRoot>
    );
}

interface WorkSessionItemProps {
    workSession: WorkSession;
    onSessionClick: (session: WorkSession) => void;
}

export function WorkSessionItem({
    workSession,
    onSessionClick,
}: WorkSessionItemProps) {
    const isActive = workSession.isActive;
    const clockOutTime = workSession.clockOutTime || new Date();
    const totalDuration = workSession.totalDuration || 0;
    const workLogsCount = workSession.workLogs.length;

    // Format the date/time range
    const timeRangeText = formatDateTimeRange(
        workSession.clockInTime,
        clockOutTime,
    );

    return (
        <div
            className="p-4 rounded-lg border border-muted bg-muted/50 hover:bg-accent/50 hover:border-border cursor-pointer transition-colors"
            onClick={() => onSessionClick(workSession)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium">
                            {formatDateLong(workSession.clockInTime)}
                        </h3>

                        <Badge
                            className={`text-xs uppercase rounded-full ${
                                isActive
                                    ? "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                            {isActive ? "Active" : "Completed"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{timeRangeText}</span>
                        {workLogsCount > 0 && (
                            <span className="text-xs">
                                {workLogsCount} ticket
                                {workLogsCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DurationTimer
                        duration={totalDuration}
                        isActive={isActive}
                        clockInTime={workSession.clockInTime}
                    />
                </div>
            </div>
        </div>
    );
}
