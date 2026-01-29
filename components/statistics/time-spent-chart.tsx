"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
    Area,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
    ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DailyTotal {
    date: string;
    hours: number;
    seconds: number;
    ticketCount: number;
}

interface TimeSpentChartProps {
    data: DailyTotal[];
    className?: string;
}

export function TimeSpentChart({ data, className }: TimeSpentChartProps) {
    const chartData = useMemo(() => {
        return data.map((d) => ({
            date: d.date,
            label: format(parseISO(d.date), "MMM d"),
            hours: Number.isFinite(d.hours) ? d.hours : 0,
        }));
    }, [data]);

    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50", className)}>
            <CardHeader>
                <CardTitle>Time Spent Over Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                                tickFormatter={(v) => `${v}h`}
                                allowDecimals
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    background: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: 8,
                                    color: "hsl(var(--foreground))",
                                }}
                                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                                formatter={(value) => [`${Number(value).toFixed(1)}h`, "Hours"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="hours"
                                stroke="hsl(var(--foreground))"
                                strokeWidth={2}
                                fill="hsl(var(--accent))"
                                fillOpacity={0.35}
                            />
                            <Line type="monotone" dataKey="hours" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
