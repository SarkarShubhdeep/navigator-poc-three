"use client";

import Image from "next/image";
import { useState } from "react";
import { JerryChat } from "./jerry-chat";

export function JerryButton() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-[#BAFFB7] to-[#0D87C9] flex items-center justify-center z-40"
        aria-label="Open Agent Jerry chat"
      >
        <Image
          src="/assets/agent-jerry-avatar.svg"
          alt="Agent Jerry"
          width={24}
          height={24}
        />
      </button>
      <JerryChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
