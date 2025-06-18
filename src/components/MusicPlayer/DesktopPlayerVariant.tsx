
import React from 'react';
import { PlayerControls } from './PlayerControls';
import { Track } from '@/types/Track';

interface DesktopPlayerVariantProps {
  track: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  hasPlaylist?: boolean;
}

export const DesktopPlayerVariant: React.FC<DesktopPlayerVariantProps> = ({
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
    <div className="flex flex-col items-center">
      <img src={track.coverUrl} alt={track.title + " cover"} className="w-48 h-48 object-cover rounded-md" />
      <h2 className="mt-4 text-lg font-semibold text-white">{track.title}</h2>
      <p className="text-sm text-amber-300">{track.artist}</p>
      
      <PlayerControls
        isPlaying={isPlaying}
        onToggle={onToggle}
        onPrevious={hasPlaylist ? onPrevious : undefined}
        onNext={hasPlaylist ? onNext : undefined}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        variant="desktop"
      />
      
      <input
        type="range"
        min="0"
        max={duration}
        value={progress}
        onChange={(e) => onSeek(parseInt(e.target.value))}
        className="w-full mt-4"
      />
    </div>
  );
};
