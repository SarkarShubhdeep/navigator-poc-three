"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { KbdGroup, Kbd } from "@/components/ui/kbd";

interface WorkLogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (description: string) => void;
    onSkip: () => void;
    onCancel: () => void;
    duration: number; // in seconds - initial duration, will update live
    getElapsedTime?: () => number; // Function to get current elapsed time
}

export function WorkLogDialog({
    open,
    onOpenChange,
    onSave,
    onSkip,
    onCancel,
    duration,
    getElapsedTime,
}: WorkLogDialogProps) {
    const [description, setDescription] = useState("");
    const [currentDuration, setCurrentDuration] = useState(duration);

    useEffect(() => {
        if (!open) {
            setDescription("");
            setCurrentDuration(duration);
            return;
        }

        // Update duration every second while dialog is open
        const interval = setInterval(() => {
            if (getElapsedTime) {
                setCurrentDuration(getElapsedTime());
            } else {
                setCurrentDuration((prev) => prev + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [open, duration, getElapsedTime]);

    const handleSave = () => {
        onSave(description);
        setDescription("");
        onOpenChange(false);
    };

    const handleSkip = () => {
        onSkip();
        setDescription("");
        onOpenChange(false);
    };

    const handleCancel = () => {
        onCancel();
        setDescription("");
        onOpenChange(false);
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog
            open={open}
            onOpenChange={() => {
                // Prevent closing without action - dialog can only be closed via buttons
            }}
        >
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Log Work Session</DialogTitle>
                    <DialogDescription>
                        You've worked for {formatDuration(currentDuration)}. Add
                        a description of what you accomplished.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="work-description">Description</Label>
                        <Textarea
                            id="work-description"
                            placeholder="What did you work on during this session?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        className="w-full sm:w-auto"
                    >
                        Skip and Pause
                    </Button>
                    <Button onClick={handleSave} className="w-full sm:w-auto">
                        <span className="">Save Work Log</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
