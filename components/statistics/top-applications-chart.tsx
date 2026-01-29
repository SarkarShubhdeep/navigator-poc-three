"use client";

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

export interface AppUsageItem {
    name: string;
    hours: number;
}

// Mock data for top 5 applications by tracked time
const MOCK_TOP_APPLICATIONS: AppUsageItem[] = [
    { name: "VS Code", hours: 20 },
    { name: "Cursor", hours: 18.3 },
    { name: "Microsoft Teams", hours: 10 },
    { name: "Chrome", hours: 8.5 },
    { name: "Postman", hours: 5.2 },
];

interface TopApplicationsChartProps {
    className?: string;
}

export function TopApplicationsChart({ className }: TopApplicationsChartProps) {
    return (
        <Card className={cn("border border-muted rounded-xl bg-muted/50 flex flex-col min-h-0", className)}>
            <CardHeader className="flex-shrink-0">
                <CardTitle>Top Applications</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                <div className="flex-1 min-h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={MOCK_TOP_APPLICATIONS}
                            layout="vertical"
                            margin={{ top: 8, right: 40, bottom: 8, left: 0 }}
                            // barCategoryGap={4}
                        >
                            <CartesianGrid
                                stroke="hsl(var(--border))"
                                strokeOpacity={0.35}
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                type="number"
                                domain={[0, "auto"]}
                                tick={{
                                    fill: "hsl(var(--muted-foreground))",
                                    fontSize: 11,
                                }}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                tickLine={{ stroke: "hsl(var(--border))" }}
                                tickFormatter={(v) => `${v}h`}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={80}
                                tick={{
                                    fill: "hsl(var(--muted-foreground))",
                                    fontSize: 10,
                                }}
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
                                labelStyle={{
                                    color: "hsl(var(--muted-foreground))",
                                }}
                                formatter={(value) => [
                                    `${Number(value).toFixed(1)}h`,
                                    "Hours",
                                ]}
                            />
                            <Bar
                                dataKey="hours"
                                fill="hsl(var(--foreground))"
                                fillOpacity={0.75}
                                maxBarSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
