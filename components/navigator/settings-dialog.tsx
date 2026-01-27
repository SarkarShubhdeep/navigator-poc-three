"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdate?: () => void;
}

export function SettingsDialog({
    open,
    onOpenChange,
    onUserUpdate,
}: SettingsDialogProps) {
    const [fullName, setFullName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadUserData();
        } else {
            // Reset form when dialog closes
            setFullName("");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
            setSuccess(null);
        }
    }, [open]);

    const loadUserData = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            // Get full name from user metadata
            const name = user.user_metadata?.full_name || "";
            setFullName(name);
        }
    };

    const handleUpdateName = async () => {
        if (!fullName.trim()) {
            setError("Full name cannot be empty");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName.trim() },
            });

            if (error) throw error;

            setSuccess("Full name updated successfully");
            onUserUpdate?.();

            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Failed to update name",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const supabase = createClient();

            // Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user?.email) {
                throw new Error("User not found");
            }

            // Verify current password by attempting to sign in
            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                });

            if (signInError) {
                throw new Error("Current password is incorrect");
            }

            // Update password (this will maintain the session)
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            setSuccess("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(null), 2000);
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to change password",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl min-h-[600px] overflow-hidden flex flex-col rounded-2xl border-none">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    defaultValue="general"
                    className="flex-1 flex gap-6 overflow-hidden"
                >
                    <TabsList className="flex flex-col h-auto w-48 justify-start bg-muted/50 p-2">
                        <TabsTrigger
                            value="general"
                            className="w-full justify-start"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="account"
                            className="w-full justify-start"
                        >
                            Account
                        </TabsTrigger>
                        <TabsTrigger
                            value="tracking"
                            className="w-full justify-start"
                        >
                            App Tracking
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto">
                        <TabsContent value="general" className="space-y-4 mt-0">
                            <p className="text-sm text-muted-foreground">
                                General settings coming soon.
                            </p>
                        </TabsContent>

                        <TabsContent value="account" className="space-y-4 mt-0">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="full-name"
                                            value={fullName}
                                            onChange={(e) =>
                                                setFullName(e.target.value)
                                            }
                                            placeholder="Enter your full name"
                                        />
                                        <Button
                                            onClick={handleUpdateName}
                                            disabled={loading}
                                            type="button"
                                        >
                                            {loading ? "Saving..." : "Save"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t">
                                    <Label htmlFor="current-password">
                                        Change Password
                                    </Label>
                                    <div className="space-y-2">
                                        <Input
                                            id="current-password"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) =>
                                                setCurrentPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Current password"
                                        />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder="New password"
                                        />
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Confirm new password"
                                        />
                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            type="button"
                                        >
                                            {loading
                                                ? "Changing..."
                                                : "Change Password"}
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive">
                                        {error}
                                    </p>
                                )}
                                {success && (
                                    <p className="text-sm text-green-600">
                                        {success}
                                    </p>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="tracking"
                            className="space-y-4 mt-0"
                        >
                            <p className="text-sm text-muted-foreground">
                                App tracking settings coming soon.
                            </p>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
