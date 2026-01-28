"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { DateRange } from "react-day-picker";
import { GanttChart } from "@/components/timeline/gantt-chart";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkLog {
    id: string;
    ticket_id: string;
    user_id: string;
    work_session_id: string;
    start_time: string;
    end_time: string | null;
    duration: number | null;
    description?: string | null;
    tickets?: {
        id: string;
        title: string;
        project_id: string;
    };
}

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

interface TimelineHeaderProps {
    viewType: ViewType;
    dateRange: DateRange | undefined;
    calendarOpen: boolean;
    setCalendarOpen: (open: boolean) => void;
    onViewTypeChange: (type: ViewType) => void;
    onDateRangeChange: (range: DateRange | undefined) => void;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

const TimelineHeader = memo(function TimelineHeader({
    viewType,
    dateRange,
    calendarOpen,
    setCalendarOpen,
    onViewTypeChange,
    onDateRangeChange,
    onPrevious,
    onNext,
    onToday,
}: TimelineHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">Timeline</h1>
                {viewType !== "custom" && dateRange?.from && dateRange?.to && (
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                            {viewType === "day"
                                ? format(dateRange.from, "EEEE, MMM d, yyyy")
                                : viewType === "week"
                                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                                  : format(dateRange.from, "MMMM yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onToday}
                                className="min-w-[80px]"
                            >
                                Today
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[140px] justify-between">
                            {viewType === "day"
                                ? "Day"
                                : viewType === "week"
                                  ? "Week"
                                  : viewType === "month"
                                    ? "Month"
                                    : "Custom"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => {
                                onViewTypeChange("day");
                            }}
                        >
                            Day
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                onViewTypeChange("week");
                            }}
                        >
                            Week
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                onViewTypeChange("month");
                            }}
                        >
                            Month
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                                if (range?.from && range?.to) {
                                    onDateRangeChange(range);
                                    onViewTypeChange("custom");
                                    setCalendarOpen(false);
                                } else if (range?.from) {
                                    onDateRangeChange(range);
                                }
                            }}
                            numberOfMonths={1}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
        prevProps.viewType === nextProps.viewType &&
        prevProps.calendarOpen === nextProps.calendarOpen &&
        prevProps.dateRange?.from?.getTime() === nextProps.dateRange?.from?.getTime() &&
        prevProps.dateRange?.to?.getTime() === nextProps.dateRange?.to?.getTime()
    );
});

export default function TimelinePage() {
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        undefined,
    );
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [viewType, setViewType] = useState<ViewType>("week");
    const [viewDate, setViewDate] = useState<Date | null>(null);

    const supabase = createClient();

    // Calculate date range based on view type
    const calculateDateRange = useCallback((type: ViewType, date: Date): DateRange => {
        const today = startOfDay(date);
        switch (type) {
            case "day":
                return {
                    from: today,
                    to: endOfDay(today),
                };
            case "week":
                return {
                    from: startOfWeek(today, { weekStartsOn: 0 }),
                    to: endOfWeek(today, { weekStartsOn: 0 }),
                };
            case "month":
                return {
                    from: startOfMonth(today),
                    to: endOfMonth(today),
                };
            default:
                return {
                    from: today,
                    to: today,
                };
        }
    }, []);

    // Initialize date range on client side only
    useEffect(() => {
        // Avoid `new Date()` during prerender: initialize on client
        const today = new Date();
        if (!viewDate) {
            setViewDate(today);
        }
        if (!dateRange) {
            const range = calculateDateRange(viewType, viewDate ?? today);
            setDateRange(range);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update date range when view type or view date changes
    useEffect(() => {
        if (viewType !== "custom" && viewDate) {
            const range = calculateDateRange(viewType, viewDate);
            setDateRange(range);
        }
    }, [viewType, viewDate, calculateDateRange]);

    // Navigate to previous period
    const handlePrevious = useCallback(() => {
        if (viewType === "day") {
            setViewDate((prev) => subDays(prev ?? new Date(), 1));
        } else if (viewType === "week") {
            setViewDate((prev) => subWeeks(prev ?? new Date(), 1));
        } else if (viewType === "month") {
            setViewDate((prev) => subMonths(prev ?? new Date(), 1));
        }
    }, [viewType]);

    // Navigate to next period
    const handleNext = useCallback(() => {
        if (viewType === "day") {
            setViewDate((prev) => addDays(prev ?? new Date(), 1));
        } else if (viewType === "week") {
            setViewDate((prev) => addWeeks(prev ?? new Date(), 1));
        } else if (viewType === "month") {
            setViewDate((prev) => addMonths(prev ?? new Date(), 1));
        }
    }, [viewType]);

    // Navigate to today
    const handleToday = useCallback(() => {
        setViewDate(new Date());
    }, []);

    // Handle view type change
    const handleViewTypeChange = useCallback((type: ViewType) => {
        setViewType(type);
        setViewDate(new Date());
    }, []);

    // Handle date range change
    const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from) {
            setViewDate(range.from);
        }
    }, []);

    // Fetch work logs
    const fetchWorkLogs = useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) {
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("startDate", dateRange.from.toISOString());
            params.append("endDate", dateRange.to.toISOString());

            const response = await fetch(`/api/work-logs?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch work logs");
            }

            const data = await response.json();
            setWorkLogs(data.workLogs || []);
        } catch (error) {
            console.error("Error fetching work logs:", error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Fetch work logs when date range changes
    useEffect(() => {
        // Verify user is authenticated before fetching
        const verifyAndFetch = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user && dateRange?.from && dateRange?.to) {
                fetchWorkLogs();
            } else if (!user) {
                setLoading(false);
            }
        };

        verifyAndFetch();
    }, [fetchWorkLogs, dateRange, supabase]);

    // Transform work logs to Gantt tasks
    const ganttTasks = useMemo<GanttTask[]>(() => {
        return workLogs
            .filter((log) => log.end_time && log.duration) // Only completed logs
            .map((log, index) => {
                const start = new Date(log.start_time);
                const end = log.end_time ? new Date(log.end_time) : new Date();

                // Calculate duration in days from actual dates
                // Use actual duration from database, but ensure minimum 1 day for visibility
                const durationMs = end.getTime() - start.getTime();
                const durationDays = Math.max(
                    1,
                    Math.ceil(durationMs / (1000 * 60 * 60 * 24)),
                );

                // Handle tickets data - could be object or array
                let ticketTitle: string | undefined;
                if (log.tickets) {
                    if (Array.isArray(log.tickets) && log.tickets.length > 0) {
                        ticketTitle = log.tickets[0].title;
                    } else if (
                        typeof log.tickets === "object" &&
                        "title" in log.tickets
                    ) {
                        ticketTitle = log.tickets.title;
                    }
                }

                return {
                    id: log.id,
                    text: ticketTitle || `Work Log ${index + 1}`,
                    start: start,
                    end: end,
                    duration: durationDays,
                    description: log.description,
                    durationSeconds: log.duration,
                    startTime: log.start_time,
                    endTime: log.end_time,
                };
            });
    }, [workLogs]);

    if (loading || !dateRange) {
        return (
            <div className="p-8 pt-0 flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading timeline...</p>
            </div>
        );
    }

    return (
        <div className="p-8 pt-0 flex flex-col h-full">
            <TimelineHeader
                viewType={viewType}
                dateRange={dateRange}
                calendarOpen={calendarOpen}
                setCalendarOpen={setCalendarOpen}
                onViewTypeChange={handleViewTypeChange}
                onDateRangeChange={handleDateRangeChange}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
            />

            <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
                {ganttTasks.length === 0 ||
                !dateRange?.from ||
                !dateRange?.to ? (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                        <p className="text-muted-foreground">
                            No work logs found for the selected date range.
                        </p>
                    </div>
                ) : (
                    <GanttChart
                        tasks={ganttTasks}
                        dateRange={{
                            from: dateRange.from,
                            to: dateRange.to,
                        }}
                        viewType={viewType}
                    />
                )}
            </div>
        </div>
    );
}
