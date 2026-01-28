"use client";

import { useEffect, useState, useCallback } from "react";

interface ActiveWorkSession {
    id: string;
    clockInTime: Date;
    elapsedTime: number;
}

/**
 * Shared hook to track active work session across the app
 * Fetches from API and calculates elapsed time consistently
 */
export function useActiveWorkSession() {
    const [activeSession, setActiveSession] = useState<ActiveWorkSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActiveSession = useCallback(async () => {
        try {
            const response = await fetch("/api/work-sessions/active");
            const data = await response.json();

            if (data.workSession) {
                const clockInTime = new Date(data.workSession.clockInTime);
                const elapsedTime = data.elapsedTime || 0;
                
                setActiveSession({
                    id: data.workSession.id,
                    clockInTime,
                    elapsedTime,
                });
            } else {
                setActiveSession(null);
            }
        } catch (error) {
            console.error("Error fetching active session:", error);
            setActiveSession(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch active session on mount and poll every 5 seconds
    useEffect(() => {
        fetchActiveSession();
        const interval = setInterval(fetchActiveSession, 5000);
        return () => clearInterval(interval);
    }, [fetchActiveSession]);

    // Update elapsed time every second when active
    useEffect(() => {
        if (!activeSession) return;

        const timer = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor(
                (now.getTime() - activeSession.clockInTime.getTime()) / 1000,
            );
            setActiveSession((prev) =>
                prev
                    ? {
                          ...prev,
                          elapsedTime: elapsed,
                      }
                    : null,
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [activeSession]);

    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return {
        activeSession,
        isLoading,
        isActive: !!activeSession,
        elapsedTime: activeSession?.elapsedTime || 0,
        formattedTime: activeSession
            ? formatElapsedTime(activeSession.elapsedTime)
            : null,
        refresh: fetchActiveSession,
    };
}
