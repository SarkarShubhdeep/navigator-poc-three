"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { getUserInitials } from "@/lib/utils/user";
import type { ProjectMember } from "@/lib/mock-data/project";
import { useState } from "react";
import { TeamDrawer } from "./team-drawer";

interface ProjectHeaderProps {
    projectName: string;
    members: ProjectMember[];
    currentUserId: string;
    teamId?: string; // Optional team ID for invite functionality
    onSettingsClick?: () => void;
    onNotificationsClick?: () => void;
}

export function ProjectHeader({
    projectName,
    members,
    currentUserId,
    teamId,
    onSettingsClick,
    onNotificationsClick,
}: ProjectHeaderProps) {
    const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);
    const currentUser = members.find((m) => m.userId === currentUserId);
    const otherMembers = members.filter((m) => m.userId !== currentUserId);

    return (
        <div className="flex items-center justify-between p-8">
            <div>
                <p className="text-sm text-muted-foreground mb-1">Team</p>
                <h1 className="text-3xl font-bold">{projectName}</h1>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                    <Settings className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNotificationsClick}
                >
                    <Bell className="h-5 w-5" />
                </Button>
                <div
                    className="flex items-center gap-1 p-2 rounded-full hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setIsTeamDrawerOpen(true)}
                >
                    {currentUser && (
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted text-sm font-mono">
                                    {getUserInitials(currentUser.fullName) ||
                                        currentUser.email
                                            .substring(0, 2)
                                            .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {currentUser.isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            )}
                        </div>
                    )}
                    {otherMembers.length > 0 && (
                        <div className="flex -space-x-2">
                            {otherMembers.slice(0, 3).map((member) => (
                                <div key={member.userId} className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-background">
                                        <AvatarFallback className="bg-muted text-sm font-mono">
                                            {getUserInitials(member.fullName) ||
                                                member.email
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {member.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <TeamDrawer
                open={isTeamDrawerOpen}
                onOpenChange={setIsTeamDrawerOpen}
                members={members}
                currentUserId={currentUserId}
                teamId={teamId}
            />
        </div>
    );
}
