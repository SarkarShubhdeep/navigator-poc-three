"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
    format,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    startOfDay,
    endOfDay,
    eachDayOfInterval,
    eachHourOfInterval,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GanttTask {
    id: string;
    text: string;
    start: Date;
    end: Date;
    duration: number; // in days
    description?: string | null;
    durationSeconds?: number | null;
    startTime: string;
    endTime: string | null;
}

type ViewType = "day" | "week" | "month" | "custom";

interface GanttChartProps {
    tasks: GanttTask[];
    dateRange: {
        from: Date;
        to: Date;
    };
    viewType: ViewType;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (secs > 0 && hours === 0 && minutes === 0) {
        parts.push(`${secs}s`);
    }

    return parts.join(" ") || "0s";
}

export function GanttChart({ tasks, dateRange, viewType }: GanttChartProps) {
    const [zoom, setZoom] = useState(1);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isDayView = viewType === "day";

    // Generate time units based on view type
    const timeUnits = useMemo(() => {
        if (isDayView) {
            // For day view, show hours
            return eachHourOfInterval({
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to),
            });
        } else {
            // For week/month/custom, show days
            return eachDayOfInterval({
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to),
            });
        }
    }, [dateRange, isDayView]);

    // Calculate the total number of time units for width calculations
    const totalUnits = isDayView
        ? differenceInHours(dateRange.to, dateRange.from) + 1
        : differenceInDays(dateRange.to, dateRange.from) + 1;
    const startDate = startOfDay(dateRange.from);

    // Base width per unit (in pixels)
    const baseUnitWidth = isDayView ? 60 : 100;
    const unitWidth = baseUnitWidth * zoom;

    // Handle zoom with mouse wheel
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
            }
        },
        [],
    );

    // Handle horizontal scroll synchronization
    const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        // Sync scroll viewport
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollLeft = scrollLeft;
        }
    }, []);

    // Find and sync ScrollArea viewport after render
    useEffect(() => {
        let viewport: HTMLDivElement | null = null;
        let cleanup: (() => void) | null = null;
        
        const findAndSetupViewport = () => {
            if (!containerRef.current) return;
            
            // Find the ScrollArea viewport within this component's container
            viewport = containerRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
            
            if (viewport && scrollViewportRef.current !== viewport) {
                scrollViewportRef.current = viewport;
                
                const handleViewportScroll = () => {
                    if (viewport && headerScrollRef.current) {
                        headerScrollRef.current.scrollLeft = viewport.scrollLeft;
                    }
                };
                
                viewport.addEventListener("scroll", handleViewportScroll);
                viewport.addEventListener("wheel", handleWheel, { passive: false });
                
                cleanup = () => {
                    viewport?.removeEventListener("scroll", handleViewportScroll);
                    viewport?.removeEventListener("wheel", handleWheel);
                };
            }
        };
        
        // Try immediately
        findAndSetupViewport();
        
        // Also try after a short delay in case ScrollArea hasn't rendered yet
        const timeout = setTimeout(findAndSetupViewport, 100);
        
        return () => {
            clearTimeout(timeout);
            cleanup?.();
        };
    }, [handleWheel]);

    // Calculate task positions and widths
    const taskData = useMemo(() => {
        return tasks.map((task) => {
            if (isDayView) {
                // For day view, use actual times (not rounded to day boundaries)
                // Use startTime and endTime from the work log for precise positioning
                const taskStart = new Date(task.startTime);
                const taskEnd = task.endTime ? new Date(task.endTime) : new Date(task.startTime);
                
                // Calculate total minutes from start of the date range (which is startOfDay)
                const totalMinutesFromStart = differenceInMinutes(taskStart, startDate);
                const hoursFromStart = totalMinutesFromStart / 60; // Convert to hours (including fractional)
                
                // Calculate duration in hours (including fractional hours)
                const totalMinutesDuration = differenceInMinutes(taskEnd, taskStart);
                const durationHours = totalMinutesDuration / 60;
                
                // Calculate pixel positions
                const leftPx = hoursFromStart * unitWidth;
                const widthPx = Math.max(20, durationHours * unitWidth); // Minimum 20px width
                
                return {
                    ...task,
                    leftPx: Math.max(0, leftPx),
                    widthPx,
                    unitsFromStart: hoursFromStart,
                    taskDuration: durationHours,
                };
            } else {
                // For week/month view, use day boundaries
                const taskStart = startOfDay(task.start);
                const taskEnd = endOfDay(task.end);
                
                const daysFromStart = differenceInDays(taskStart, startDate);
                const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
                
                const leftPx = daysFromStart * unitWidth;
                const widthPx = Math.max(20, taskDuration * unitWidth);
                
                return {
                    ...task,
                    leftPx: Math.max(0, leftPx),
                    widthPx,
                    unitsFromStart: daysFromStart,
                    taskDuration,
                };
            }
        });
    }, [tasks, startDate, isDayView, unitWidth]);

    if (tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <p className="text-muted-foreground">No tasks to display</p>
            </div>
        );
    }

    const totalWidth = totalUnits * unitWidth;

    return (
        <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
            {/* Header with dates */}
            <div className="sticky top-0 z-10 bg-background border-b flex-shrink-0">
                <div className="flex">
                    {/* Task name column */}
                    <div className="w-64 flex-shrink-0 border-r p-2 font-medium text-sm">
                        Task name
                    </div>
                    {/* Timeline header - synchronized scroll */}
                    <div
                        ref={headerScrollRef}
                        className="flex-1 overflow-x-auto overflow-y-hidden"
                        onScroll={handleHeaderScroll}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div
                            className="relative h-10"
                            style={{ width: `${totalWidth}px` }}
                        >
                            {timeUnits.map((unit, index) => {
                                const isFirstOfMonth =
                                    !isDayView &&
                                    (index === 0 || unit.getDate() === 1);
                                const isWeekend =
                                    !isDayView &&
                                    (unit.getDay() === 0 || unit.getDay() === 6);
                                const showHourLabel = isDayView && index % 4 === 0; // Show every 4 hours

                                return (
                                    <div
                                        key={unit.toISOString()}
                                        className={cn(
                                            "absolute border-r border-border flex flex-col items-center justify-center text-xs",
                                            isWeekend && "bg-muted/30",
                                        )}
                                        style={{
                                            left: `${index * unitWidth}px`,
                                            width: `${unitWidth}px`,
                                            height: "100%",
                                        }}
                                    >
                                        {isFirstOfMonth && (
                                            <div className="font-medium">
                                                {format(unit, "MMM")}
                                            </div>
                                        )}
                                        {showHourLabel && (
                                            <div className="font-medium">
                                                {format(unit, "h a")}
                                            </div>
                                        )}
                                        {!isDayView && (
                                            <div
                                                className={cn(
                                                    "mt-0.5",
                                                    isFirstOfMonth && "font-medium",
                                                )}
                                            >
                                                {format(unit, "d")}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Combined horizontal scroll area for tasks */}
            <ScrollArea className="flex-1">
                <div style={{ width: `${totalWidth + 256}px`, minHeight: '100%' }}>
                    {taskData.map((task, index) => (
                        <div
                            key={task.id}
                            className={cn(
                                "flex border-b border-border hover:bg-muted/50 transition-colors",
                                index % 2 === 0 && "bg-muted/20",
                            )}
                        >
                            {/* Task name */}
                            <div className="w-64 flex-shrink-0 border-r p-3 flex items-center">
                                <div className="truncate text-sm">{task.text}</div>
                            </div>

                            {/* Timeline bar - no individual scrolling */}
                            <div className="relative h-12" style={{ width: `${totalWidth}px` }}>
                                <div className="absolute inset-0">
                                    {/* Grid lines */}
                                    {timeUnits.map((unit, unitIndex) => (
                                        <div
                                            key={unit.toISOString()}
                                            className="absolute border-r border-border"
                                            style={{
                                                left: `${unitIndex * unitWidth}px`,
                                                width: `${unitWidth}px`,
                                                height: "100%",
                                            }}
                                        />
                                    ))}

                                    {/* Task bar */}
                                    {task.leftPx < totalWidth &&
                                        task.leftPx + task.widthPx > 0 && (
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "absolute top-2 bottom-2 rounded-md",
                                                            "bg-primary text-primary-foreground",
                                                            "flex items-center justify-center",
                                                            "text-xs font-medium px-2",
                                                            "shadow-sm border border-primary/20",
                                                            "hover:bg-primary/90 transition-colors",
                                                            "cursor-pointer",
                                                        )}
                                                        style={{
                                                            left: `${task.leftPx}px`,
                                                            width: `${task.widthPx}px`,
                                                        }}
                                                    >
                                                        {task.widthPx > 80 && (
                                                            <span className="truncate">
                                                                {task.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="max-w-xs"
                                        >
                                            <div className="space-y-3">
                                                <div className="font-semibold">
                                                    {task.text}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs">
                                                        {task.description}
                                                    </div>
                                                )}
                                                <div className="text-xs space-y-0.5">
                                                    <div>
                                                        <span className="font-medium">
                                                            Start:
                                                        </span>{" "}
                                                        {format(
                                                            new Date(
                                                                task.startTime,
                                                            ),
                                                            "MMM d, yyyy h:mm a",
                                                        )}
                                                    </div>
                                                    {task.endTime && (
                                                        <div>
                                                            <span className="font-medium">
                                                                End:
                                                            </span>{" "}
                                                            {format(
                                                                new Date(
                                                                    task.endTime,
                                                                ),
                                                                "MMM d, yyyy h:mm a",
                                                            )}
                                                        </div>
                                                    )}
                                                    {task.durationSeconds !==
                                                        null &&
                                                        task.durationSeconds !==
                                                            undefined && (
                                                            <div>
                                                                <span className="font-medium">
                                                                    Duration:
                                                                </span>{" "}
                                                                {formatDuration(
                                                                    task.durationSeconds,
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            {/* Zoom hint */}
            <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/30 flex-shrink-0">
                Use Ctrl/Cmd + Scroll to zoom • Scroll horizontally to navigate
            </div>
        </div>
    );
}
