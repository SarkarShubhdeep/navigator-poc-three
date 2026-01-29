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

interface ProjectStats {
    projectId: string;
    projectName: string;
    totalHours: number;
    totalSeconds: number;
    ticketCount: number;
}

interface TopProjectsChartProps {
    data: ProjectStats[];
    className?: string;
}

export function TopProjectsChart({ data, className }: TopProjectsChartProps) {
    const chartData = useMemo(() => {
        const top = data.slice(0, Math.min(10, data.length));
        // Recharts horizontal bars are easiest with layout="vertical"
        return top.map((d) => ({
            name: d.projectName || d.projectId,
            hours: Number.isFinite(d.totalHours) ? d.totalHours : 0,
        }));
    }, [data]);

    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50", className)}>
            <CardHeader>
                <CardTitle>Top Projects by Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
                        >
                            <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                                tickFormatter={(v) => `${v}h`}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={140}
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
                                formatter={(value) => [`${Number(value).toFixed(1)}h`, "Hours"]}
                            />
                            <Bar dataKey="hours" fill="hsl(var(--foreground))" fillOpacity={0.75} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
