"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { WorkSessionItem } from "./work-session-item";
import type { WorkSession } from "@/lib/mock-data/project";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { formatDateLong } from "@/lib/utils/time";

interface WorkSessionsSectionProps {
    workSessions: WorkSession[];
    onSessionClick: (session: WorkSession) => void;
}

export function WorkSessionsSection({
    workSessions,
    onSessionClick,
}: WorkSessionsSectionProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSessions = workSessions.filter((session) => {
        const matchesSearch =
            !searchQuery ||
            formatDateLong(session.clockInTime)
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="p-2 py-6">
            <div className="flex items-center justify-between px-4 pb-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">Work Sessions</h1>
                    <Badge className="text-sm font-semibold font-mono rounded-full">
                        {filteredSessions.length}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {filteredSessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        No work sessions found.
                    </p>
                ) : (
                    filteredSessions.map((session) => (
                        <WorkSessionItem
                            key={session.id}
                            workSession={session}
                            onSessionClick={onSessionClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
