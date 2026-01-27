"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getUserInitials } from "@/lib/utils/user";
import type {
    ProjectMember,
    TicketPriority,
} from "@/lib/mock-data/project";
import { useState, useEffect } from "react";

interface CreateTicketDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ProjectMember[];
    currentUserId: string;
    projectId: string;
    onCreate: (ticketData: {
        title: string;
        description: string;
        priority: TicketPriority;
        assignedToUserId: string;
        status: "open" | "close";
    }) => void;
}

export function CreateTicketDrawer({
    open,
    onOpenChange,
    members,
    currentUserId,
    projectId, // Required prop for type safety, used by parent component
    onCreate,
}: CreateTicketDrawerProps) {
    // projectId is required by the interface but not used in this component
    // since tickets are always created for the current project context
    void projectId;
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TicketPriority>("medium");
    const [assignedToUserId, setAssignedToUserId] = useState(currentUserId);
    const [status, setStatus] = useState<"open" | "close">("open");

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setTitle("");
            setDescription("");
            setPriority("medium");
            setAssignedToUserId(currentUserId);
            setStatus("open");
        }
    }, [open, currentUserId]);

    const assignedMember = members.find((m) => m.userId === assignedToUserId);

    const getStatusColor = (status: "open" | "close") => {
        switch (status) {
            case "open":
                return "bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300";
            case "close":
                return "bg-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-300";
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

    const handleSubmit = () => {
        if (!title.trim()) {
            return; // Title is required
        }

        onCreate({
            title: title.trim(),
            description: description.trim(),
            priority,
            assignedToUserId,
            status,
        });

        // Close drawer and reset form
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-lg font-semibold">
                        Create New Ticket
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1">
                        <Label
                            htmlFor="title"
                            className="text-muted-foreground"
                        >
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter ticket title"
                            className="text-lg font-semibold"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <Label
                            htmlFor="description"
                            className="text-muted-foreground"
                        >
                            Description
                        </Label>
                        <textarea
                            id="description"
                            placeholder="Add a detailed description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="assigned-to"
                            className="text-muted-foreground"
                        >
                            Assigned to
                        </Label>
                        <Select
                            value={assignedToUserId}
                            onValueChange={setAssignedToUserId}
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
                        <div className="space-y-2 flex-1">
                            <Label
                                htmlFor="priority"
                                className="text-muted-foreground"
                            >
                                Priority
                            </Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={priority}
                                    onValueChange={(value) =>
                                        setPriority(value as TicketPriority)
                                    }
                                >
                                    <SelectTrigger
                                        id="priority"
                                        className="flex-1"
                                    >
                                        <Badge
                                            className={`text-xs uppercase rounded-full ${getPriorityColor(
                                                priority,
                                            )}`}
                                        >
                                            {priority}
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

                        <div className="space-y-2 flex-1">
                            <Label
                                htmlFor="status"
                                className="text-muted-foreground"
                            >
                                Status
                            </Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(value as "open" | "close")
                                    }
                                >
                                    <SelectTrigger
                                        id="status"
                                        className="flex-1"
                                    >
                                        <Badge
                                            className={`text-xs uppercase rounded-full ${getStatusColor(
                                                status,
                                            )}`}
                                        >
                                            {status}
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

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!title.trim()}
                        >
                            Create Ticket
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
