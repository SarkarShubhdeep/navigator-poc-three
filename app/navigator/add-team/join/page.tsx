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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!inviteCode.trim() || inviteCode.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/teams/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: inviteCode.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to join team");
            }

            // Redirect to personal page (teams list will show the new team)
            // The sidebar will automatically refresh teams
            router.push("/navigator/personal");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to join team",
            );
            setLoading(false);
        }
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

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                        onClick={handleJoin}
                        disabled={inviteCode.length !== 6 || loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "Joining..." : "Continue"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
