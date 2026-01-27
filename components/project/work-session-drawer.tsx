"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Clock, Tickets, X } from "lucide-react";
import {
    formatDateTimeRange,
    formatDurationHuman,
    formatDateLong,
    formatTimeWithSeconds,
} from "@/lib/utils/time";
import type { WorkSession, WorkLog } from "@/lib/mock-data/project";
import { Button } from "@/components/ui/button";

interface WorkSessionDrawerProps {
    workSession: WorkSession | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WorkSessionDrawer({
    workSession,
    open,
    onOpenChange,
}: WorkSessionDrawerProps) {
    if (!workSession) return null;

    const isActive = workSession.isActive;
    const clockOutTime = workSession.clockOutTime || new Date();
    const totalDuration = workSession.totalDuration || 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <span>Work Session</span>
                        </SheetTitle>
                        <SheetClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </SheetClose>
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {/* Date */}
                    <div className="space-y-1">
                        <Label className="text-muted-foreground">Date</Label>
                        <p className="text-base font-medium">
                            {formatDateLong(workSession.clockInTime)}
                        </p>
                    </div>

                    {/* Time Range */}
                    <div className="space-y-1">
                        <Label className="text-muted-foreground">
                            Time Range
                        </Label>
                        <p className="text-base font-medium">
                            {formatTimeWithSeconds(workSession.clockInTime)} -{" "}
                            {isActive
                                ? "Active"
                                : formatTimeWithSeconds(clockOutTime)}
                        </p>
                    </div>

                    {/* Total Duration */}
                    <div className="space-y-1">
                        <Label className="text-muted-foreground">
                            Total Duration
                        </Label>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="font-mono text-base px-3 py-1"
                            >
                                {formatDurationHuman(totalDuration)}
                            </Badge>
                            {isActive && (
                                <Badge className="bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-300 text-xs uppercase rounded-full">
                                    Active
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Work Logs */}
                    <div className="pt-6 border-t">
                        <div className="flex items-center gap-2 mb-4">
                            <Tickets className="h-5 w-5" />
                            <h3 className="text-lg font-medium">
                                Ticket Work Logs
                            </h3>
                            {workSession.workLogs.length > 0 && (
                                <Badge className="text-xs font-semibold font-mono rounded-full">
                                    {workSession.workLogs.length}
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-2">
                            {workSession.workLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No work logs for this session.
                                </p>
                            ) : (
                                workSession.workLogs
                                    .sort(
                                        (a, b) =>
                                            b.startTime.getTime() -
                                            a.startTime.getTime(),
                                    )
                                    .map((workLog) => (
                                        <WorkLogCard
                                            key={workLog.id}
                                            workLog={workLog}
                                        />
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function WorkLogCard({ workLog }: { workLog: WorkLog }) {
    return (
        <div className="p-4 rounded-lg border border-muted bg-muted hover:bg-accent/50 hover:border-border transition-colors">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    {workLog.ticketTitle && (
                        <h4 className="text-sm font-medium mb-1">
                            {workLog.ticketTitle}
                        </h4>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {formatDateTimeRange(
                            workLog.startTime,
                            workLog.endTime,
                        )}
                    </span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs ml-2">
                    {formatDurationHuman(workLog.duration)}
                </Badge>
            </div>
            {workLog.description && (
                <p className="text-sm text-muted-foreground mt-2">
                    {workLog.description}
                </p>
            )}
        </div>
    );
}
