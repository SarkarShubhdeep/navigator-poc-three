"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { SummaryCards } from "@/components/statistics/summary-cards";
import { ActivityHeatmap } from "@/components/statistics/activity-heatmap";
import { TimeSpentChart } from "@/components/statistics/time-spent-chart";
import { TicketsCompletedChart } from "@/components/statistics/tickets-completed-chart";
import { TopProjectsChart } from "@/components/statistics/top-projects-chart";
import { DayOfWeekChart } from "@/components/statistics/day-of-week-chart";

interface StatisticsData {
    summary: {
        totalHours: number;
        averageHoursPerDay: number;
        totalTicketsCompleted: number;
        averageSessionDurationHours: number;
        longestWorkDayHours: number;
        longestWorkDay: string;
    };
    dailyTotals: Array<{
        date: string;
        hours: number;
        seconds: number;
        ticketCount: number;
    }>;
    dayOfWeekStats: Array<{
        day: string;
        dayIndex: number;
        averageHours: number;
        totalHours: number;
        totalSeconds: number;
        dayCount: number;
    }>;
    topProjects: Array<{
        projectId: string;
        projectName: string;
        totalHours: number;
        totalSeconds: number;
        ticketCount: number;
    }>;
    heatmapData: Array<{
        date: string;
        value: number;
        bin: number;
        bins: Array<{ bin: number; count: number }>;
    }>;
    dateRange: {
        start: string;
        end: string;
    };
}

export default function StatisticsPage() {
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Initialize date range to current week
    useEffect(() => {
        if (!dateRange) {
            const today = new Date();
            setDateRange({
                from: startOfWeek(today, { weekStartsOn: 0 }),
                to: endOfWeek(today, { weekStartsOn: 0 }),
            });
        }
    }, [dateRange]);

    // Fetch statistics
    const fetchStatistics = useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) {
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("startDate", dateRange.from.toISOString());
            params.append("endDate", dateRange.to.toISOString());

            const response = await fetch(
                `/api/statistics?${params.toString()}`,
            );
            if (!response.ok) {
                throw new Error("Failed to fetch statistics");
            }

            const data = await response.json();
            setStatistics(data);
        } catch (error) {
            console.error("Error fetching statistics:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Fetch statistics when date range changes
    useEffect(() => {
        if (dateRange?.from && dateRange?.to) {
            fetchStatistics();
        }
    }, [fetchStatistics, dateRange]);

    if (loading || !dateRange || !statistics) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading statistics...</p>
            </div>
        );
    }

    return (
        <div className="p-8 pt-0 flex flex-col h-full overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6">
                <h1 className="text-3xl font-bold">Statistics</h1>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[300px] justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground",
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={(range) => {
                                setDateRange(range);
                                if (range?.from && range?.to) {
                                    setCalendarOpen(false);
                                }
                            }}
                            numberOfMonths={1}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 pb-8">
                {/* Top row: Summary | Heatmap | Highlights (1/3 each) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                    <div className="h-full">
                        <SummaryCards
                            stats={statistics.summary}
                            className="grid grid-cols-2 gap-4 h-full"
                        />
                    </div>

                    <ActivityHeatmap
                        className="h-full"
                        data={statistics.heatmapData}
                        startDate={statistics.dateRange.start}
                        endDate={statistics.dateRange.end}
                    />

                    <div className="h-full rounded-xl border bg-card p-6">
                        <div className="text-sm font-medium text-muted-foreground">
                            Highlights
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-baseline justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Top project
                                </div>
                                <div className="text-sm font-medium text-right">
                                    {statistics.topProjects?.[0]?.projectName ??
                                        "—"}
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Top project hours
                                </div>
                                <div className="text-sm font-medium">
                                    {statistics.topProjects?.[0]?.totalHours
                                        ? `${statistics.topProjects[0].totalHours.toFixed(1)}h`
                                        : "—"}
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Most active weekday
                                </div>
                                <div className="text-sm font-medium">
                                    {(() => {
                                        const best =
                                            statistics.dayOfWeekStats?.reduce(
                                                (acc, cur) =>
                                                    cur.totalHours >
                                                    (acc?.totalHours ?? -1)
                                                        ? cur
                                                        : acc,
                                                undefined as
                                                    | (typeof statistics.dayOfWeekStats)[number]
                                                    | undefined,
                                            );
                                        return best?.day ?? "—";
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Time Spent Chart */}
                    <TimeSpentChart data={statistics.dailyTotals} />

                    {/* Tickets Completed Chart */}
                    <TicketsCompletedChart data={statistics.dailyTotals} />

                    {/* Top Projects Chart */}
                    <TopProjectsChart data={statistics.topProjects} />

                    {/* Day of Week Chart */}
                    <DayOfWeekChart data={statistics.dayOfWeekStats} />
                </div>
            </div>
        </div>
    );
}
