"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { MessageCircle, Send, Users } from "lucide-react";
import { getUserInitials } from "@/lib/utils/user";
import type { ProjectMember } from "@/lib/mock-data/project";
import { useState } from "react";

interface TeamDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: ProjectMember[];
    currentUserId: string;
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
}: TeamDrawerProps) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const currentUser = members.find((m) => m.userId === currentUserId);
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                    </SheetTitle>
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
        </Sheet>
    );
}
