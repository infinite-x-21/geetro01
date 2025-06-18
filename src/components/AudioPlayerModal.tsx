
import React from "react";
import { X } from "lucide-react";
import MusicPlayer from "@/components/MusicPlayer";

// NOTE: Deprecated for main story feed—now use dedicated /stories/:id page!

interface AudioPlayerModalProps {
  open: boolean;
  onClose: () => void;
  audioUrl: string;
  coverUrl: string;
  title?: string;
  artist?: string;
}

export default function AudioPlayerModal({
  open,
  onClose,
  audioUrl,
  coverUrl,
  title = "",
  artist = "",
}: AudioPlayerModalProps) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="relative w-full max-w-xs bg-[#f5f6fa] rounded-2xl shadow-2xl flex flex-col items-center pb-6 pt-1 select-none"
        style={{
          boxShadow: "0 8px 48px 0 rgba(38,44,74,0.27)",
          minHeight: 520, maxHeight: '90vh', minWidth: 320
        }}>
        <button
          onClick={onClose}
          className="absolute right-4 top-3 bg-white rounded-full p-1 shadow hover:scale-110 transition"
          aria-label="Close player"
        >
          <X size={20} />
        </button>
        {/* Simulated mobile notch */}
        <div className="w-24 h-2.5 bg-black/50 rounded-b-2xl mt-2 mb-2 mx-auto" />
        {/* Main: Music Player */}
        <MusicPlayer
          audioUrl={audioUrl}
          coverUrl={coverUrl}
          title={title}
          artist={artist}
          variant="mobile-modal"
        />
      </div>
    </div>
  );
}
