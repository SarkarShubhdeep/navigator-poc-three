"use client";

import { Header } from "@/components/navigator/header";
import { JerryButton } from "@/components/navigator/jerry-button";
import { Sidebar } from "@/components/navigator/sidebar";
import { useState } from "react";

export default function NavigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <JerryButton />
    </div>
  );
}
