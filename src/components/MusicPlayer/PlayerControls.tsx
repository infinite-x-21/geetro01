
import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface PlayerControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  variant?: "mobile" | "desktop";
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onToggle,
  onPrevious,
  onNext,
  canGoPrev = false,
  canGoNext = false,
  variant = "desktop",
}) => {
  if (variant === "mobile") {
    return (
      <div className="flex items-end justify-center gap-8 mb-2">
        <div className="flex flex-col items-center">
          {onPrevious && (
            <button
              aria-label="Previous Song"
              className={`bg-white border border-neutral-200 rounded-full p-2 shadow ${!canGoPrev ? "opacity-50 cursor-default pointer-events-none" : ""}`}
              onClick={onPrevious}
              disabled={!canGoPrev}
            >
              <SkipBack size={22} className="text-black" />
            </button>
          )}
        </div>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className="rounded-full bg-amber-600 shadow-inner p-4 mx-2 transition-transform hover:scale-110 audio-glow"
          style={{
            boxShadow:
              "0 2.5px 22px 0 rgba(245,158,11,0.4), 0 1px 14px 0 rgba(245,158,11,0.2)",
          }}
          onClick={onToggle}
        >
          {isPlaying ? (
            <Pause size={32} className="text-white" />
          ) : (
            <Play size={32} className="text-white" />
          )}
        </button>
        <div className="flex flex-col items-center">
          {onNext && (
            <button
              aria-label="Next Song"
              className={`bg-white border border-neutral-200 rounded-full p-2 shadow ${!canGoNext ? "opacity-50 cursor-default pointer-events-none" : ""}`}
              onClick={onNext}
              disabled={!canGoNext}
            >
              <SkipForward size={22} className="text-black" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center mt-4">
      {onPrevious && (
        <button
          onClick={onPrevious}
          disabled={!canGoPrev}
          className={`px-4 py-2 bg-amber-600 text-white rounded-full focus:outline-none hover:bg-amber-700 transition-colors ${!canGoPrev ? "opacity-50 cursor-default pointer-events-none" : ""}`}
        >
          <SkipBack size={20} />
        </button>
      )}
      <button
        onClick={onToggle}
        className="mx-4 px-6 py-3 bg-amber-600 text-white rounded-full focus:outline-none hover:bg-amber-700 transition-colors audio-glow"
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      {onNext && (
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`px-4 py-2 bg-amber-600 text-white rounded-full focus:outline-none hover:bg-amber-700 transition-colors ${!canGoNext ? "opacity-50 cursor-default pointer-events-none" : ""}`}
        >
          <SkipForward size={20} />
        </button>
      )}
    </div>
  );
};
