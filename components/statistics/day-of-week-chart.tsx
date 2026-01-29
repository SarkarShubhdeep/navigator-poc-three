"use client";

import { useMemo } from "react";
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

interface DayOfWeekStats {
    day: string;
    dayIndex: number;
    averageHours: number;
    totalHours: number;
    totalSeconds: number;
    dayCount: number;
}

interface DayOfWeekChartProps {
    data: DayOfWeekStats[];
    className?: string;
}

export function DayOfWeekChart({ data, className }: DayOfWeekChartProps) {
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => a.dayIndex - b.dayIndex)
            .map((d) => ({
                day: d.day,
                avgHours: Number.isFinite(d.averageHours) ? d.averageHours : 0,
                isWeekend: d.dayIndex === 0 || d.dayIndex === 6,
            }));
    }, [data]);

    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50", className)}>
            <CardHeader>
                <CardTitle>Work Distribution by Day of Week</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="day"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                                tickFormatter={(v) => `${v}h`}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    background: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: 8,
                                    color: "hsl(var(--foreground))",
                                }}
                                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                                formatter={(value) => [`${Number(value).toFixed(1)}h`, "Avg hours"]}
                            />
                            {/* weekend bars are slightly muted via fillOpacity callback */}
                            <Bar
                                dataKey="avgHours"
                                fill="hsl(var(--foreground))"
                                fillOpacity={0.75}
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
