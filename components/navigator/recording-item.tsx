"use client";

import { Play } from "lucide-react";
import { formatDuration, formatTime } from "@/lib/utils/time";

export interface Recording {
    id: string;
    ticketTitle: string;
    description: string;
    durationSeconds: number;
    startTime: Date;
    endTime: Date;
}

interface RecordingItemProps {
    recording: Recording;
    onClick?: () => void;
}

export function RecordingItem({ recording, onClick }: RecordingItemProps) {
    const durationDisplay = formatDuration(recording.durationSeconds);
    const startTimeStr = formatTime(recording.startTime);
    const endTimeStr = formatTime(recording.endTime);

    return (
        <div
            className="p-4 rounded-lg border border-muted bg-muted/50 hover:bg-accent/50 hover:border-border cursor-pointer transition-colors flex gap-4"
            onClick={onClick}
        >
            {/* Left: thumbnail placeholder + play button */}
            <div className="relative flex-shrink-0 w-32 h-20 rounded-md bg-muted border border-muted overflow-hidden flex items-center justify-center">
                <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors z-10"
                    aria-label="Play recording"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                    }}
                >
                    <Play className="h-8 w-8 text-white fill-white" />
                </button>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium truncate">
                    {recording.ticketTitle}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {recording.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{durationDisplay}</span>
                    <span>
                        {startTimeStr} – {endTimeStr}
                    </span>
                </div>
            </div>
        </div>
    );
}
