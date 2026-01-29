"use client";

import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { formatDateLong, formatTimeWithSeconds } from "@/lib/utils/time";

interface LiveClockProps {
    projectId?: string;
    onWorkSessionChange?: (isActive: boolean) => void;
}

export function LiveClock({ projectId, onWorkSessionChange }: LiveClockProps) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isActive, setIsActive] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [clockInTime, setClockInTime] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchActiveSession = useCallback(async () => {
        try {
            const response = await fetch("/api/work-sessions/active");
            const data = await response.json();

            if (data.workSession) {
                setIsActive(true);
                setClockInTime(new Date(data.workSession.clockInTime));
                setElapsedSeconds(data.elapsedTime || 0);
                onWorkSessionChange?.(true);
            } else {
                setIsActive(false);
                setClockInTime(null);
                setElapsedSeconds(0);
                onWorkSessionChange?.(false);
            }
        } catch (error) {
            console.error("Error fetching active session:", error);
        }
    }, [onWorkSessionChange]);

    // Fetch active session on mount and when projectId changes
    useEffect(() => {
        fetchActiveSession();
        const interval = setInterval(fetchActiveSession, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [projectId, fetchActiveSession]);

    // Update timer display when active
    useEffect(() => {
        if (!isActive || !clockInTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor(
                (now.getTime() - clockInTime.getTime()) / 1000,
            );
            setElapsedSeconds(elapsed);
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, clockInTime]);

    // Update current time for clock display
    useEffect(() => {
        if (isActive) return; // Don't update clock when showing timer

        // Initialize immediately
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive]);

    const handleClockIn = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/work-sessions/clock-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: projectId || null }),
            });

            if (!response.ok) {
                throw new Error("Failed to clock in");
            }

            const data = await response.json();
            setIsActive(true);
            setClockInTime(new Date(data.workSession.clockInTime));
            setElapsedSeconds(0);
            onWorkSessionChange?.(true);
        } catch (error) {
            console.error("Error clocking in:", error);
            alert("Failed to clock in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClockOut = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/work-sessions/clock-out", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to clock out");
            }

            setIsActive(false);
            setClockInTime(null);
            setElapsedSeconds(0);
            setCurrentTime(new Date());
            onWorkSessionChange?.(false);
        } catch (error) {
            console.error("Error clocking out:", error);
            alert("Failed to clock out. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (isActive && clockInTime) {
        // Show timer when work session is active
        return (
            <div className="flex items-center justify-between border border-destructive/20 p-6 py-8 rounded-xl bg-destructive/10">
                <div>
                    <div className="text-5xl font-medium font-mono mb-2">
                        {formatElapsedTime(elapsedSeconds)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                        Work session active
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Button
                        onClick={handleClockOut}
                        disabled={loading}
                        className="bg-black text-white hover:bg-black/90 rounded-full h-16 px-8 font-semibold w-fit dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        Clock Out
                        <Square className="h-4 w-4 ml-2" fill="currentColor" />
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Click to end your work session
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between border border-muted p-6 py-8 rounded-xl bg-muted/50">
            <div>
                <div className="text-5xl font-medium font-mono mb-2">
                    {formatTimeWithSeconds(currentTime)}
                </div>
                <div className="text-lg text-muted-foreground">
                    {formatDateLong(currentTime)}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="bg-black text-white hover:bg-black/90 rounded-full h-16 px-16 font-semibold w-fit dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    Start your work session
                    <Play className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">
                    Clock in to start working on tickets
                </p>
            </div>
        </div>
    );
}
