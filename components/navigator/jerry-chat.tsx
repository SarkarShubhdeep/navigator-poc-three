"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface JerryChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JerryChat({ isOpen, onClose }: JerryChatProps) {
    if (!isOpen) return null;

    return (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] flex flex-col z-50 shadow-xl rounded-2xl border border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 pt-2">
                <h3 className="font-semibold">Agent Jerry</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0">
                <div className="flex-1 overflow-y-auto p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        Chat with Agent Jerry to get help with your time
                        tracking.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Type your message..."
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                // Handle message send
                            }
                        }}
                    />
                    <Button>Send</Button>
                </div>
            </CardContent>
        </Card>
    );
}
