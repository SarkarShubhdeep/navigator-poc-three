"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Send, Users, UserPlus, Copy, Check, X } from "lucide-react";
import { getUserInitials } from "@/lib/utils/user";
import type { ProjectMember } from "@/lib/mock-data/project";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface TeamDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ProjectMember[];
    currentUserId: string;
    teamId?: string; // Optional team ID to fetch invite code
}

interface ChatMessage {
    id: string;
    userId: string;
    message: string;
    timestamp: Date;
}

export function TeamDrawer({
    open,
    onOpenChange,
    members,
    currentUserId,
    teamId,
}: TeamDrawerProps) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [loadingInviteCode, setLoadingInviteCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const sortedMembers = [...members].sort((a, b) => {
        // Current user first, then online users, then offline
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
    });

    const handleSendMessage = () => {
        if (!message.trim()) return;

        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            userId: currentUserId,
            message: message.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getDisplayName = (member: ProjectMember) => {
        if (member.userId === currentUserId) return "You";
        return member.fullName || member.email;
    };

    const fetchInviteCode = async () => {
        if (!teamId) {
            console.warn("fetchInviteCode called but teamId is not provided");
            return;
        }

        setLoadingInviteCode(true);
        try {
            console.log("Fetching invite code for team:", teamId);
            const response = await fetch(`/api/teams/${teamId}`);
            
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = "Failed to fetch team";
                try {
                    const errorData = await response.json() as {
                        details?: string;
                        error?: string;
                        code?: string;
                        hint?: string;
                    };
                    errorMessage = errorData.details || errorData.error || errorMessage;
                    console.error("Team fetch error:", {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData,
                    });
                } catch {
                    errorMessage = response.statusText || errorMessage;
                    console.error("Team fetch error (no JSON):", {
                        status: response.status,
                        statusText: response.statusText,
                    });
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log("Team data received:", data);
            setInviteCode(data.team?.invite_code || null);
        } catch (error) {
            console.error("Error fetching invite code:", error);
            // Set error state to show in UI
            setInviteCode(null);
        } finally {
            setLoadingInviteCode(false);
        }
    };

    const handleInviteClick = () => {
        if (!teamId) {
            console.error("Cannot fetch invite code: teamId is not provided");
            alert("Team ID is missing. Cannot fetch invite code.");
            return;
        }
        setIsInviteDialogOpen(true);
        // Always fetch invite code when dialog opens to ensure we have the latest
        fetchInviteCode();
    };

    const handleCopyCode = async () => {
        if (!inviteCode) return;

        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange} >
            <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members
                        </SheetTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleInviteClick}
                                className="rounded-full"
                                disabled={!teamId}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite
                            </Button>
                            <SheetClose asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close</span>
                                </Button>
                            </SheetClose>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Team Members List - Top Half */}
                    <div className="flex-1 overflow-y-auto px-4">
                        <div className="space-y-1">
                            {sortedMembers.map((member) => {
                                const isCurrentUser =
                                    member.userId === currentUserId;
                                return (
                                    <div
                                        key={member.userId}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-muted text-sm font-mono">
                                                    {getUserInitials(
                                                        member.fullName,
                                                    ) ||
                                                        member.email
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">
                                                    {getDisplayName(member)}
                                                </p>
                                                {isCurrentUser && (
                                                    <span className="text-xs text-muted-foreground">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs font-mono ${
                                                    member.isOnline
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {member.isOnline
                                                    ? "ONLINE"
                                                    : "OFFLINE"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Team Chat - Bottom Half */}
                    <div className="flex-1 flex flex-col min-h-0 border-t">
                        <div className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                <h3 className="font-semibold">Team Chat</h3>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-muted-foreground">
                                        No messages yet. Start the conversation!
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const member = members.find(
                                        (m) => m.userId === msg.userId,
                                    );
                                    const isCurrentUserMessage =
                                        msg.userId === currentUserId;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 ${
                                                isCurrentUserMessage
                                                    ? "flex-row-reverse"
                                                    : ""
                                            }`}
                                        >
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarFallback className="bg-muted text-xs font-mono">
                                                    {member
                                                        ? getUserInitials(
                                                              member.fullName,
                                                          ) ||
                                                          member.email
                                                              .substring(0, 2)
                                                              .toUpperCase()
                                                        : "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div
                                                className={`flex flex-col gap-1 max-w-[70%] ${
                                                    isCurrentUserMessage
                                                        ? "items-end"
                                                        : ""
                                                }`}
                                            >
                                                <div
                                                    className={`rounded-lg px-3 py-2 ${
                                                        isCurrentUserMessage
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                    }`}
                                                >
                                                    <p className="text-sm">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {msg.timestamp.toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="px-6 py-4 border-t">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>

            {/* Invite Code Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invite Team Members</DialogTitle>
                        <DialogDescription>
                            Share this code with others to invite them to join
                            your team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {loadingInviteCode ? (
                            <div className="flex items-center justify-center py-8">
                                <p className="text-muted-foreground">
                                    Loading invite code...
                                </p>
                            </div>
                        ) : inviteCode ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center">
                                    <Badge
                                        variant="secondary"
                                        className="text-2xl font-mono font-bold px-6 py-3 tracking-wider"
                                    >
                                        {inviteCode}
                                    </Badge>
                                </div>
                                <Button
                                    onClick={handleCopyCode}
                                    className="w-full"
                                    variant={copied ? "default" : "outline"}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Code
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 space-y-2">
                                <p className="text-muted-foreground text-center">
                                    Failed to load invite code
                                </p>
                                {teamId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchInviteCode}
                                    >
                                        Retry
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Sheet>
    );
}
