import {
    startOfDay,
    format,
    eachDayOfInterval,
    getDay,
    startOfWeek,
    endOfWeek,
    differenceInDays,
    addDays,
} from "date-fns";

export interface WorkLog {
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
        projects?: {
            id: string;
            name: string;
        };
    };
}

export interface DailyTotal {
    date: string;
    hours: number;
    seconds: number;
    ticketCount: number;
}

export interface DayOfWeekStats {
    day: string;
    dayIndex: number;
    averageHours: number;
    totalHours: number;
    totalSeconds: number;
    dayCount: number;
}

export interface ProjectStats {
    projectId: string;
    projectName: string;
    totalHours: number;
    totalSeconds: number;
    ticketCount: number;
}

/**
 * Convert seconds to hours
 */
export function secondsToHours(seconds: number): number {
    return seconds / 3600;
}

/**
 * Format duration in seconds to readable string (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    return parts.join(" ") || "0m";
}

/**
 * Group work logs by day and calculate totals
 */
export function groupByDay(
    workLogs: WorkLog[],
    startDate: Date,
    endDate: Date,
): DailyTotal[] {
    const days = eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(endDate),
    });

    const dayMap = new Map<string, DailyTotal>();

    // Initialize all days with zero
    days.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        dayMap.set(dateKey, {
            date: dateKey,
            hours: 0,
            seconds: 0,
            ticketCount: 0,
        });
    });

    // Aggregate work logs
    const ticketSet = new Set<string>();
    workLogs.forEach((log) => {
        if (!log.end_time || !log.duration) return;

        const logDate = new Date(log.start_time);
        const dateKey = format(startOfDay(logDate), "yyyy-MM-dd");

        if (dayMap.has(dateKey)) {
            const dayData = dayMap.get(dateKey)!;
            dayData.seconds += log.duration;
            dayData.hours = secondsToHours(dayData.seconds);

            // Count unique tickets per day
            if (!ticketSet.has(`${dateKey}-${log.ticket_id}`)) {
                ticketSet.add(`${dateKey}-${log.ticket_id}`);
                dayData.ticketCount++;
            }
        }
    });

    return Array.from(dayMap.values());
}

/**
 * Calculate work distribution by day of week
 */
export function getDayOfWeekStats(
    workLogs: WorkLog[],
): DayOfWeekStats[] {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats: DayOfWeekStats[] = dayNames.map((day, index) => ({
        day,
        dayIndex: index,
        averageHours: 0,
        totalHours: 0,
        totalSeconds: 0,
        dayCount: 0,
    }));

    const dayTotals = new Map<number, { seconds: number; count: number }>();

    workLogs.forEach((log) => {
        if (!log.end_time || !log.duration) return;

        const logDate = new Date(log.start_time);
        const dayOfWeek = getDay(logDate);

        if (!dayTotals.has(dayOfWeek)) {
            dayTotals.set(dayOfWeek, { seconds: 0, count: 0 });
        }

        const stats = dayTotals.get(dayOfWeek)!;
        stats.seconds += log.duration;
        stats.count++;
    });

    dayTotals.forEach((stats, dayOfWeek) => {
        const dayData = dayStats[dayOfWeek];
        dayData.totalSeconds = stats.seconds;
        dayData.totalHours = secondsToHours(stats.seconds);
        dayData.dayCount = stats.count;
        dayData.averageHours =
            stats.count > 0 ? secondsToHours(stats.seconds) / stats.count : 0;
    });

    return dayStats;
}

/**
 * Calculate top projects by total time spent
 */
export function getTopProjects(
    workLogs: WorkLog[],
    limit: number = 10,
): ProjectStats[] {
    const projectMap = new Map<string, ProjectStats>();
    const ticketSet = new Set<string>();

    workLogs.forEach((log) => {
        if (!log.end_time || !log.duration || !log.tickets?.project_id) return;

        const projectId = log.tickets.project_id;
        const projectName =
            log.tickets.projects?.name || log.tickets.title || "Unknown Project";

        if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
                projectId,
                projectName,
                totalHours: 0,
                totalSeconds: 0,
                ticketCount: 0,
            });
        }

        const project = projectMap.get(projectId)!;
        project.totalSeconds += log.duration;
        project.totalHours = secondsToHours(project.totalSeconds);

        // Count unique tickets
        if (!ticketSet.has(`${projectId}-${log.ticket_id}`)) {
            ticketSet.add(`${projectId}-${log.ticket_id}`);
            project.ticketCount++;
        }
    });

    return Array.from(projectMap.values())
        .sort((a, b) => b.totalSeconds - a.totalSeconds)
        .slice(0, limit);
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(workLogs: WorkLog[], dailyTotals: DailyTotal[]) {
    const totalSeconds = workLogs.reduce((sum, log) => {
        return sum + (log.duration || 0);
    }, 0);

    const totalHours = secondsToHours(totalSeconds);
    const dayCount = dailyTotals.filter((d) => d.seconds > 0).length;
    const averageHoursPerDay = dayCount > 0 ? totalHours / dayCount : 0;

    // Count unique tickets completed
    const completedTickets = new Set<string>();
    workLogs.forEach((log) => {
        if (log.end_time && log.duration) {
            completedTickets.add(log.ticket_id);
        }
    });

    // Calculate average session duration
    const sessions = new Map<string, number>();
    workLogs.forEach((log) => {
        if (log.end_time && log.duration) {
            const sessionId = log.work_session_id;
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, 0);
            }
            sessions.set(sessionId, sessions.get(sessionId)! + log.duration);
        }
    });

    const sessionDurations = Array.from(sessions.values());
    const averageSessionDuration =
        sessionDurations.length > 0
            ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
            : 0;

    // Find longest work day
    const longestDay = dailyTotals.reduce(
        (max, day) => (day.seconds > max.seconds ? day : max),
        dailyTotals[0] || { date: "", hours: 0, seconds: 0, ticketCount: 0 },
    );

    return {
        totalHours,
        totalSeconds,
        averageHoursPerDay,
        totalTicketsCompleted: completedTickets.size,
        averageSessionDuration,
        averageSessionDurationHours: secondsToHours(averageSessionDuration),
        longestWorkDay: longestDay.date,
        longestWorkDayHours: longestDay.hours,
    };
}

/**
 * Prepare heatmap data structure
 */
export function prepareHeatmapData(
    dailyTotals: DailyTotal[],
    startDate: Date,
    endDate: Date,
): Array<{ date: Date; value: number; bin: number; bins: Array<{ bin: number; count: number }> }> {
    const weeks: Array<{ date: Date; value: number; bin: number; bins: Array<{ bin: number; count: number }> }> = [];
    const start = startOfWeek(startOfDay(startDate), { weekStartsOn: 0 });
    const end = endOfWeek(startOfDay(endDate), { weekStartsOn: 0 });
    const totalWeeks = Math.ceil(differenceInDays(end, start) / 7);

    // Create a map of date -> hours
    const dateMap = new Map<string, number>();
    dailyTotals.forEach((day) => {
        dateMap.set(day.date, day.hours);
    });

    // Generate weeks
    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
        const weekStart = addDays(start, weekIndex * 7);
        const bins: Array<{ bin: number; count: number }> = [];

        // Generate days of week (0 = Sunday, 6 = Saturday)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const dayDate = addDays(weekStart, dayOfWeek);
            const dateKey = format(dayDate, "yyyy-MM-dd");
            const hours = dateMap.get(dateKey) || 0;

            bins.push({
                bin: dayOfWeek,
                count: hours,
            });
        }

        weeks.push({
            date: weekStart,
            value: bins.reduce((sum, b) => sum + b.count, 0),
            bin: weekIndex,
            bins,
        });
    }

    return weeks;
}
