"use client";

import { Header } from "@/components/navigator/header";
import { JerryButton } from "@/components/navigator/jerry-button";
import { Sidebar } from "@/components/navigator/sidebar";
import { useRef, useState, Suspense } from "react";

export default function NavigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const headerRefreshRef = useRef<(() => void) | null>(null);

  const handleUserUpdate = () => {
    // Refresh header when user data changes
    headerRefreshRef.current?.();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<div className={`h-screen border-r bg-background ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`} />}>
        <Sidebar isOpen={sidebarOpen} onUserUpdate={handleUserUpdate} />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          refreshRef={headerRefreshRef}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <JerryButton />
    </div>
  );
}
