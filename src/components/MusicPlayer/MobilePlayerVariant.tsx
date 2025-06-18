
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { PlayerControls } from './PlayerControls';
import { formatTime } from '@/utils/audioUtils';
import { Track } from '@/types/Track';

interface MobilePlayerVariantProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onToggle: () => void;
  onSeek: (val: number[]) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  hasPlaylist?: boolean;
}

export const MobilePlayerVariant: React.FC<MobilePlayerVariantProps> = ({
  track,
  isPlaying,
  progress,
  duration,
  onToggle,
  onSeek,
  onPrevious,
  onNext,
  canGoPrev,
  canGoNext,
  hasPlaylist,
}) => {
  return (
    <div className="flex flex-col items-center w-full px-2 pt-2">
      {/* Cover with curved mask */}
      <div className="relative w-full flex justify-center">
        <div className="w-48 h-60 md:w-56 md:h-68 relative overflow-hidden">
          <img
            src={track.coverUrl}
            alt={track.title + " cover"}
            className="w-full h-full object-cover"
            style={{
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderBottomLeftRadius: 115,
              borderBottomRightRadius: 115,
            }}
          />
          {/* White bottom arc under image */}
          <div
            className="absolute left-0 bottom-0 w-full h-1.5"
            style={{
              background: "linear-gradient(to top, #f5f6fa 80%, transparent 105%)",
              borderBottomLeftRadius: 115,
              borderBottomRightRadius: 115,
            }}
          />
        </div>
      </div>
      
      {/* Title and Artist */}
      <div className="mt-5 w-full flex flex-col items-center">
        <div className="text-lg font-bold text-white text-center mb-1">{track.title}</div>
        <div className="text-sm text-neutral-400 font-medium">{track.artist}</div>
      </div>
      
      {/* Seek bar / slider */}
      <div className="w-full flex flex-col items-center mt-8 mb-2">
        <div className="w-5/6">
          <Slider
            value={[progress]}
            min={0}
            max={duration || 1}
            step={1}
            onValueChange={onSeek}
            className="bg-transparent"
            style={{ background: "none" }}
          />
        </div>
      </div>
      
      {/* Time and Controls */}
      <div className="flex flex-col items-center w-full mt-2">
        <span className="mb-2 text-xs text-neutral-400 font-mono">{formatTime(progress)}</span>
        <PlayerControls
          isPlaying={isPlaying}
          onToggle={onToggle}
          onPrevious={hasPlaylist ? onPrevious : undefined}
          onNext={hasPlaylist ? onNext : undefined}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          variant="mobile"
        />
      </div>
    </div>
  );
};
