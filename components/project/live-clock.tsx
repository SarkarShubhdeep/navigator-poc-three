"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateLong, formatTimeWithSeconds } from "@/lib/utils/time";

interface LiveClockProps {
    onStartWorkSession?: () => void;
}

export function LiveClock({ onStartWorkSession }: LiveClockProps) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        // Initialize on client side only
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!currentTime) {
        return (
            <div className="flex items-center justify-between border border-muted p-8 py-8 rounded-xl bg-muted/50">
                <div>
                    <div className="text-5xl font-medium font-mono mb-2">
                        --:--:--
                    </div>
                    <div className="text-lg text-muted-foreground">
                        Loading...
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Button
                        onClick={onStartWorkSession}
                        size="lg"
                        className="bg-black text-white hover:bg-black/90"
                    >
                        Start your work session
                        <Play className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-sm text-muted-foreground">
                        Clock in to start working on tickets
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between border border-muted p-6 py-8 rounded-xl bg-muted/50">
            <div>
                <div className="text-5xl font-medium font-mono mb-2">
                    {formatTimeWithSeconds(currentTime)}
                </div>
                <div className="text-lg text-muted-foreground">
                    {formatDateLong(currentTime)}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Button
                    onClick={onStartWorkSession}
                    className="bg-black text-white hover:bg-black/90 rounded-full h-16 px-8 font-semibold w-fit dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    Start your work session
                    <Play className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">
                    Clock in to start working on tickets
                </p>
            </div>
        </div>
    );
}
