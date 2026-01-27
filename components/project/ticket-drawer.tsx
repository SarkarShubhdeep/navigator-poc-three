"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Briefcase } from "lucide-react";
import { getUserInitials } from "@/lib/utils/user";
import { formatDateTimeRange, formatDurationHuman } from "@/lib/utils/time";
import type {
    Ticket,
    ProjectMember,
    TicketStatus,
    TicketPriority,
} from "@/lib/mock-data/project";
import React, { useState } from "react";

interface TicketDrawerProps {
    ticket: Ticket | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ProjectMember[];
    currentUserId: string;
    onUpdate?: (ticket: Ticket) => void;
}

export function TicketDrawer({
    ticket,
    open,
    onOpenChange,
    members,
    currentUserId,
    onUpdate,
}: TicketDrawerProps) {
    const [localTicket, setLocalTicket] = useState<Ticket | null>(ticket);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");

    // Update local ticket when prop changes
    React.useEffect(() => {
        setLocalTicket(ticket);
        setEditedTitle(ticket?.title || "");
    }, [ticket]);

    if (!ticket || !localTicket) return null;

    const assignedMember = members.find(
        (m) => m.userId === localTicket.assignedToUserId,
    );

    const handleStatusChange = (newStatus: string) => {
        const updated = { ...localTicket, status: newStatus as TicketStatus };
        setLocalTicket(updated);
        onUpdate?.(updated);
    };

    const handlePriorityChange = (newPriority: string) => {
        const updated = {
            ...localTicket,
            priority: newPriority as TicketPriority,
        };
        setLocalTicket(updated);
        onUpdate?.(updated);
    };

    const handleAssignedChange = (userId: string) => {
        const updated = { ...localTicket, assignedToUserId: userId };
        setLocalTicket(updated);
        onUpdate?.(updated);
    };

    const handleTitleEdit = () => {
        setIsEditingTitle(true);
        setEditedTitle(localTicket.title);
    };

    const handleTitleSave = () => {
        const updated = { ...localTicket, title: editedTitle.trim() };
        setLocalTicket(updated);
        onUpdate?.(updated);
        setIsEditingTitle(false);
    };

    const handleTitleCancel = () => {
        setEditedTitle(localTicket.title);
        setIsEditingTitle(false);
    };

    const getStatusColor = (status: TicketStatus) => {
        switch (status) {
            case "open":
                return "bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300";
            case "close":
                return "bg-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300";
            case "active":
                return "bg-red-300 text-red-900 dark:bg-red-900 dark:text-red-300";
            default:
                return "";
        }
    };

    const getPriorityColor = (priority: TicketPriority) => {
        switch (priority) {
            case "low":
                return "bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-300";
            case "medium":
                return "bg-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300";
            case "high":
            case "critical":
                return "bg-red-300 text-red-900 dark:bg-red-900 dark:text-red-300";
            default:
                return "";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input
                                    value={editedTitle}
                                    onChange={(e) =>
                                        setEditedTitle(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleTitleSave();
                                        } else if (e.key === "Escape") {
                                            handleTitleCancel();
                                        }
                                    }}
                                    className="flex-1 text-lg font-semibold border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-1">
                                <span
                                    className="flex text-lg font-semibold cursor-pointer"
                                    onClick={handleTitleEdit}
                                >
                                    {localTicket.title}
                                </span>
                            </div>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1">
                        <Label
                            htmlFor="assigned-to"
                            className="text-muted-foreground"
                        >
                            Assigned to
                        </Label>
                        <Select
                            value={localTicket.assignedToUserId}
                            onValueChange={handleAssignedChange}
                        >
                            <SelectTrigger id="assigned-to">
                                <SelectValue>
                                    {assignedMember ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarFallback className="bg-muted text-xs font-mono">
                                                    {getUserInitials(
                                                        assignedMember.fullName,
                                                    ) ||
                                                        assignedMember.email
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>
                                                {assignedMember.userId ===
                                                currentUserId
                                                    ? "Me"
                                                    : assignedMember.fullName ||
                                                      assignedMember.email}
                                            </span>
                                        </div>
                                    ) : (
                                        "Select member"
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((member) => (
                                    <SelectItem
                                        key={member.userId}
                                        value={member.userId}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarFallback className="bg-muted text-xs font-mono">
                                                    {getUserInitials(
                                                        member.fullName,
                                                    ) ||
                                                        member.email
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>
                                                {member.userId === currentUserId
                                                    ? "Me"
                                                    : member.fullName ||
                                                      member.email}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="priority"
                                className="text-muted-foreground"
                            >
                                Priority
                            </Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={localTicket.priority}
                                    onValueChange={handlePriorityChange}
                                >
                                    <SelectTrigger
                                        id="priority"
                                        className="flex-1"
                                    >
                                        <Badge
                                            className={`text-xs uppercase rounded-full ${getPriorityColor(
                                                localTicket.priority,
                                            )}`}
                                        >
                                            {localTicket.priority}
                                        </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-green-300 text-green-900 text-xs uppercase rounded-full ml-auto">
                                                    low
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-yellow-300 text-yellow-900 text-xs uppercase rounded-full ml-auto">
                                                    medium
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-red-300 text-red-900 text-xs uppercase rounded-full ml-auto">
                                                    high
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-red-300 text-red-900 text-xs uppercase rounded-full ml-auto">
                                                    critical
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="status"
                                className="text-muted-foreground"
                            >
                                Status
                            </Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={localTicket.status}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="flex-1"
                                    >
                                        <Badge
                                            className={`text-xs uppercase rounded-full ${getStatusColor(
                                                localTicket.status,
                                            )}`}
                                        >
                                            {localTicket.status}
                                        </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-300 text-blue-900 text-xs uppercase rounded-full ml-auto">
                                                    open
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="close">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-yellow-300 text-yellow-900 text-xs uppercase rounded-full ml-auto">
                                                    close
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1 pb-4">
                        <Label
                            htmlFor="description"
                            className="text-muted-foreground"
                        >
                            Description
                        </Label>
                        <textarea
                            id="description"
                            placeholder="Add a more detailed description..."
                            value={localTicket.description}
                            onChange={(e) => {
                                const updated = {
                                    ...localTicket,
                                    description: e.target.value,
                                };
                                setLocalTicket(updated);
                            }}
                            onBlur={() => onUpdate?.(localTicket)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="pt-6 border-t">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="h-5 w-5" />
                            <h3 className="text-lg font-medium">
                                Work History
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {localTicket.workLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No work history yet.
                                </p>
                            ) : (
                                localTicket.workLogs
                                    .sort(
                                        (a, b) =>
                                            b.startTime.getTime() -
                                            a.startTime.getTime(),
                                    )
                                    .map((workLog) => (
                                        <div
                                            key={workLog.id}
                                            className="p-4 rounded-lg border border-muted bg-muted hover:bg-accent/50 hover:border-border cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">
                                                    {formatDateTimeRange(
                                                        workLog.startTime,
                                                        workLog.endTime,
                                                    )}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-xs"
                                                >
                                                    {formatDurationHuman(
                                                        workLog.duration,
                                                    )}
                                                </Badge>
                                            </div>
                                            {workLog.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {workLog.description}
                                                </p>
                                            )}
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
