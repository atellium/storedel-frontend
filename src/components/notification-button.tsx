"use client";

import { useState } from "react";
import { registerCurrentDeviceToken } from "@/lib/notifications";

export default function EnableNotificationsButton() {
    const [token, setToken] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function enable() {
        setIsLoading(true);
        setMessage("");

        try {
            const registration = await registerCurrentDeviceToken();

            setToken(registration?.token ?? "");
            setMessage("Notifications enabled.");
        } catch (error) {
            console.error(error);
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Could not enable notifications",
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function copyToken() {
        if (!token) return;

        await navigator.clipboard.writeText(token);
        setMessage("Token copied.");
    }

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={enable}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:bg-border disabled:text-secondary"
            >
                {isLoading ? "Enabling..." : "Enable Notifications"}
            </button>

            {token && (
                <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-medium text-secondary">FCM token</p>
                    <p className="mt-2 max-h-24 overflow-auto break-all rounded-xl bg-background p-3 text-xs font-medium leading-5 text-main">
                        {token}
                    </p>
                    <button
                        type="button"
                        onClick={copyToken}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-main px-4 text-sm font-semibold text-white"
                    >
                        Copy token
                    </button>
                </div>
            )}

            {message && (
                <p className="text-xs font-medium text-secondary">{message}</p>
            )}
        </div>
    );
}
