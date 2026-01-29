"use client";

import { useMemo } from "react";
import {
    addDays,
    differenceInDays,
    endOfWeek,
    format,
    isAfter,
    isBefore,
    startOfMonth,
    startOfDay,
    startOfWeek,
    subMonths,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HeatmapData {
    date: string;
    value: number;
    bin: number;
    bins: Array<{ bin: number; count: number }>;
}

interface ActivityHeatmapProps {
    data: HeatmapData[];
    startDate: string;
    endDate: string;
    className?: string;
}

export function ActivityHeatmap({
    data,
    startDate,
    endDate,
    className,
}: ActivityHeatmapProps) {
    const rawStart = useMemo(
        () => startOfDay(new Date(startDate)),
        [startDate],
    );
    const rangeEnd = useMemo(() => startOfDay(new Date(endDate)), [endDate]);
    // Always show ~4 months ending at rangeEnd (calendar-aligned)
    const rangeStart = useMemo(
        () => startOfMonth(subMonths(rangeEnd, 3)),
        [rangeEnd],
    );
    const calendarStart = useMemo(
        () => startOfWeek(rangeStart, { weekStartsOn: 0 }),
        [rangeStart],
    );
    const calendarEnd = useMemo(
        () => endOfWeek(rangeEnd, { weekStartsOn: 0 }),
        [rangeEnd],
    );

    const dayToHours = useMemo(() => {
        // Data comes as week bins; convert to dateKey map.
        // If API already gives full bins, prefer that, but keep it robust.
        const map = new Map<string, number>();
        // Try to rebuild based on provided week index/bin structure.
        const week0 = startOfWeek(rawStart, { weekStartsOn: 0 });
        data.forEach((week) => {
            week.bins.forEach((b) => {
                const d = addDays(week0, week.bin * 7 + b.bin);
                map.set(format(d, "yyyy-MM-dd"), b.count);
            });
        });
        return map;
    }, [data, rawStart]);

    const days = useMemo(() => {
        const total = differenceInDays(calendarEnd, calendarStart) + 1;
        return Array.from({ length: total }, (_, i) =>
            addDays(calendarStart, i),
        );
    }, [calendarStart, calendarEnd]);

    const maxHours = useMemo(() => {
        let max = 0;
        dayToHours.forEach((v) => {
            if (v > max) max = v;
        });
        return Math.max(1, max);
    }, [dayToHours]);

    const intensityClass = (hours: number) => {
        // 0..4 buckets, neutral.
        const t = hours / maxHours;
        if (t <= 0) return "bg-muted/60";
        if (t < 0.25) return "bg-muted";
        if (t < 0.5) return "bg-foreground/20";
        if (t < 0.75) return "bg-foreground/40";
        return "bg-foreground/70";
    };

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const cellSize = 18; // px (bigger dots)
    const cellGap = 6; // px
    const weeksCount = Math.ceil(days.length / 7);

    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50", className)}>
            <CardHeader className="flex-shrink-0">
                <CardTitle>Activity Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
                <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                    <div className="flex items-start gap-3 w-full min-w-0 overflow-hidden">
                        {/* Day labels column (sticky, doesn't scroll) */}
                        <div
                            className="grid flex-shrink-0 pl-4 pb-4"
                            style={{
                                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                                rowGap: cellGap,
                                paddingTop: 0,
                            }}
                        >
                            {dayLabels.map((d) => (
                                <div
                                    key={d}
                                    className="text-xs text-muted-foreground flex items-center justify-start"
                                    style={{ height: `${cellSize}px` }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Scrollable heatmap grid */}
                        <ScrollArea
                            className={cn(
                                "flex-1 min-w-0 max-w-full",
                                // This heatmap only needs horizontal scrolling; hide vertical scrollbar + corner
                                "[&_[data-slot='scroll-area-scrollbar'][data-orientation='vertical']]:hidden",
                                "[&_[data-radix-scroll-area-corner]]:hidden",
                            )}
                        >
                            <div
                                className="grid"
                                style={{
                                    gridTemplateColumns: `repeat(${weeksCount}, ${cellSize}px)`,
                                    gridTemplateRows: `repeat(7, ${cellSize}px)`,
                                    gap: `${cellGap}px`,
                                    gridAutoFlow: "column",
                                    width: `${weeksCount * (cellSize + cellGap)}px`,
                                }}
                            >
                                {days.map((d) => {
                                    const key = format(d, "yyyy-MM-dd");
                                    const hours = dayToHours.get(key) ?? 0;
                                    const inRange =
                                        !isBefore(d, rangeStart) &&
                                        !isAfter(d, rangeEnd);
                                    return (
                                        <div
                                            key={key}
                                            title={`${format(d, "MMM d, yyyy")}: ${hours.toFixed(1)}h`}
                                            className={cn(
                                                "rounded-md border border-border/50",
                                                intensityClass(hours),
                                                !inRange && "opacity-40",
                                            )}
                                            style={{
                                                height: `${cellSize}px`,
                                                width: `${cellSize}px`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
