"use client";

import { WorkSessionsSection } from "@/components/project/work-sessions-section";
import { WorkSessionDrawer } from "@/components/project/work-session-drawer";
import { transformWorkSession } from "@/lib/utils/supabase-types";
import type { WorkSession } from "@/lib/mock-data/project";
import { useState, useEffect, Suspense } from "react";

function WorkSessionsContent() {
    const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<WorkSession | null>(
        null,
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkSessions = async () => {
            try {
                const response = await fetch("/api/work-sessions");
                if (!response.ok) {
                    throw new Error("Failed to fetch work sessions");
                }
                const data = await response.json();
                const transformedSessions = data.workSessions.map(
                    transformWorkSession,
                );
                setWorkSessions(transformedSessions);
            } catch (error) {
                console.error("Error fetching work sessions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkSessions();
    }, []);

    const handleSessionClick = (session: WorkSession) => {
        setSelectedSession(session);
        setIsDrawerOpen(true);
    };

    if (loading) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading work sessions...</p>
            </div>
        );
    }

    return (
        <div className="p-8 pt-0 space-y-6">
            <WorkSessionsSection
                workSessions={workSessions}
                onSessionClick={handleSessionClick}
            />

            <WorkSessionDrawer
                workSession={selectedSession}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
            />
        </div>
    );
}

export default function WorkSessionsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 pt-0 flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            }
        >
            <WorkSessionsContent />
        </Suspense>
    );
}
