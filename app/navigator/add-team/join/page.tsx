"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinTeamPage() {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState("");

    const handleJoin = () => {
        if (!inviteCode.trim() || inviteCode.length !== 6) return;

        // TODO: Implement team joining logic
        // This will:
        // 1. Validate the 6-character invite code
        // 2. Find the team/project associated with the code
        // 3. Add current user as a member to the team
        // 4. Redirect to the team's project page

        console.log("Joining team with code:", inviteCode);
        // For now, just redirect back
        router.push("/navigator/personal");
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (value.length <= 6) {
            setInviteCode(value);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-8">
            <div className="w-full max-w-md space-y-8">
                <div className="space-y-2">
                    <Link
                        href="/navigator/add-team"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Join Team</h1>
                        <p className="text-lg text-muted-foreground">
                            Enter the 6-character code.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invite-code">Invite Code</Label>
                        <Input
                            id="invite-code"
                            value={inviteCode}
                            onChange={handleCodeChange}
                            placeholder="E.G. X7Y2Z9"
                            className="text-lg font-mono tracking-widest text-center"
                            maxLength={6}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoin();
                                }
                            }}
                        />
                    </div>

                    <Button
                        onClick={handleJoin}
                        disabled={inviteCode.length !== 6}
                        className="w-full"
                        size="lg"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
