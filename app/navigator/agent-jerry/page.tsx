"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function AgentJerryPage() {
    const [message, setMessage] = useState("");

    return (
        <div className="p-8 pt-0 flex flex-col h-full">
            <div className="flex flex-col items-center flex-1 min-h-0">
                {/* Header */}
                <div className="text-center py-6">
                    <h1 className="text-3xl font-bold">Agent Jerry</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                        Your AI assistant for time tracking and work sessions.
                        Ask Jerry to start or pause timers, log time to tickets,
                        or get a summary of your day.
                    </p>
                </div>

                {/* Center: Jerry animation */}
                <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <div className="w-[200px] h-[200px] rounded-full border border-muted overflow-hidden shrink-0">
                        <Image
                            src="/assets/jerry-animation.gif"
                            alt="Agent Jerry"
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    Hi, I&apos;m Jerry. Ask me anything about your work
                    sessions, tickets, or time tracking.
                </p>

                {/* Chat area */}
                <div className="w-full max-w-2xl mt-6 border rounded-2xl bg-muted/20 flex flex-col min-h-0 ">
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* sm buttons of actions like start timer, pause timer, log time to ticket, get summary of day, etc. */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full border"
                            >
                                Start Timer
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full border"
                            >
                                Pause Timer
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full border"
                            >
                                Log Time to Ticket
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full border"
                            >
                                Get Summary of Day
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full border"
                            >
                                Generate Report for this week
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-2 p-4">
                        <Input
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    // Send message (UI only)
                                }
                            }}
                            className="flex-1 border-none"
                        />
                        <Button
                            type="button"
                            size="icon"
                            aria-label="Send"
                            className="rounded-full"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
