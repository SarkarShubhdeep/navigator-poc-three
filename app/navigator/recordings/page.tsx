"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    RecordingItem,
    type Recording,
} from "@/components/navigator/recording-item";

// Mock data for recordings
const MOCK_RECORDINGS: Recording[] = [
    {
        id: "1",
        ticketTitle: "Fix login redirect after session expiry",
        description:
            "Updated auth flow to redirect users to login when session expires. Added toast notification for better UX.",
        durationSeconds: 312, // 5:12
        startTime: new Date(2026, 0, 28, 9, 15, 0),
        endTime: new Date(2026, 0, 28, 9, 20, 12),
    },
    {
        id: "2",
        ticketTitle: "Add export to CSV for time reports",
        description:
            "Implemented CSV export for work log reports with date range filter and column selection.",
        durationSeconds: 1845, // 30:45
        startTime: new Date(2026, 0, 28, 10, 30, 0),
        endTime: new Date(2026, 0, 28, 11, 0, 45),
    },
    {
        id: "3",
        ticketTitle: "Refactor API error handling",
        description:
            "Centralized error handling and added consistent error response format across endpoints.",
        durationSeconds: 726, // 12:06
        startTime: new Date(2026, 0, 27, 14, 0, 0),
        endTime: new Date(2026, 0, 27, 14, 12, 6),
    },
    {
        id: "4",
        ticketTitle: "Dashboard performance optimization",
        description:
            "Reduced initial load time by lazy-loading charts and memoizing expensive computations.",
        durationSeconds: 420,
        startTime: new Date(2026, 0, 27, 16, 45, 0),
        endTime: new Date(2026, 0, 27, 16, 52, 0),
    },
];

export default function RecordingsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRecordings = MOCK_RECORDINGS.filter((recording) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            recording.ticketTitle.toLowerCase().includes(q) ||
            recording.description.toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-8 pt-0 space-y-6 max-w-5xl mx-auto">
            <div className="p-2 py-6">
                <div className="flex items-center justify-between px-4 pb-6">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">Recordings</h1>
                        <Badge className="text-sm font-semibold font-mono rounded-full">
                            {filteredRecordings.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search recordings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {filteredRecordings.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No recordings found.
                        </p>
                    ) : (
                        filteredRecordings.map((recording) => (
                            <RecordingItem
                                key={recording.id}
                                recording={recording}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
