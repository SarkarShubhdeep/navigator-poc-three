"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryStats {
    totalHours: number;
    averageHoursPerDay: number;
    totalTicketsCompleted: number;
    averageSessionDurationHours: number;
    longestWorkDayHours: number;
    longestWorkDay: string;
}

interface SummaryCardsProps {
    stats: SummaryStats;
    className?: string;
}

export function SummaryCards({ stats, className }: SummaryCardsProps) {
    const cards = [
        {
            title: "Total Hours",
            value: stats.totalHours.toFixed(1),
            unit: "h",
            description: "Total time worked",
        },
        {
            title: "Avg Hours/Day",
            value: stats.averageHoursPerDay.toFixed(1),
            unit: "h",
            description: "Average per active day",
        },
        {
            title: "Avg Session",
            value: stats.averageSessionDurationHours.toFixed(1),
            unit: "h",
            description: "Average session duration",
        },
        {
            title: "Longest Day",
            value: stats.longestWorkDayHours.toFixed(1),
            unit: "h",
            description: stats.longestWorkDay
                ? new Date(stats.longestWorkDay).toLocaleDateString()
                : "N/A",
        },
    ];

    return (
        <div className={className ?? "grid grid-cols-2 gap-4"}>
            {cards.map((card) => (
                <Card key={card.title} className="h-full border border-muted rounded-xl bg-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">
                                {card.value}
                            </span>
                            {card.unit && (
                                <span className="text-sm text-muted-foreground">
                                    {card.unit}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
