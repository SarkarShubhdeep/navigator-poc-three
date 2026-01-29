"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface DailyTotal {
    date: string;
    hours: number;
    seconds: number;
    ticketCount: number;
}

interface TicketsCompletedChartProps {
    data: DailyTotal[];
    className?: string;
}

export function TicketsCompletedChart({ data, className }: TicketsCompletedChartProps) {
    const chartData = useMemo(() => {
        return data
            .map((d) => ({
                date: d.date,
                label: format(parseISO(d.date), "MMM d"),
                tickets: d.ticketCount ?? 0,
            }))
            .filter((d) => d.tickets > 0);
    }, [data]);

    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50", className)}>
            <CardHeader>
                <CardTitle>Tickets Completed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    background: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: 8,
                                    color: "hsl(var(--foreground))",
                                }}
                                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                            />
                            <Bar dataKey="tickets" fill="hsl(var(--foreground))" fillOpacity={0.75} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
