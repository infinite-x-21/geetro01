import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, RotateCw, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

export const BottomAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    playlist,
    currentTrackIndex,
    isPlaying,
    progress,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    skipBack,
    skipForward,
  } = useAudioPlayer();

  // Like logic using localStorage
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    if (!currentTrack) return;
    const likedAudios = JSON.parse(localStorage.getItem('likedAudios') || '[]');
    setLiked(likedAudios.includes(currentTrack.id));
  }, [currentTrack]);

  const handleLike = () => {
    if (!currentTrack) return;
    let likedAudios = JSON.parse(localStorage.getItem('likedAudios') || '[]');
    if (likedAudios.includes(currentTrack.id)) {
      likedAudios = likedAudios.filter((id: string) => id !== currentTrack.id);
      setLiked(false);
    } else {
      likedAudios.push(currentTrack.id);
      setLiked(true);
    }
    localStorage.setItem('likedAudios', JSON.stringify(likedAudios));
  };

  if (!currentTrack) return null;

  // Filter playlist for same category as current track
  const sameCategoryPlaylist = playlist.filter(
    (track) => (track as any).category === (currentTrack as any).category
  );
  const sameCategoryIndex = sameCategoryPlaylist.findIndex(
    (track) => track.id === currentTrack.id
  );
  const canGoPrev = sameCategoryPlaylist.length > 1 && sameCategoryIndex > 0;
  const canGoNext = sameCategoryPlaylist.length > 1 && sameCategoryIndex < sameCategoryPlaylist.length - 1;

  const handlePrev = () => {
    if (!canGoPrev) return;
    const prevTrack = sameCategoryPlaylist[sameCategoryIndex - 1];
    if (prevTrack) {
      // Play previous track in same category
      useAudioPlayer().playTrack(prevTrack, sameCategoryPlaylist);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const nextTrack = sameCategoryPlaylist[sameCategoryIndex + 1];
    if (nextTrack) {
      // Play next track in same category
      useAudioPlayer().playTrack(nextTrack, sameCategoryPlaylist);
    }
  };

  const handleSeek = (val: number[]) => {
    seekTo(val[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center gap-4 px-4 py-3 max-w-6xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate text-white">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skipBack(10)}
            className="p-1 rounded-full hover:bg-muted text-foreground transition-colors"
            aria-label="10 seconds back"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`p-1 rounded-full transition-colors ${
              canGoPrev 
                ? 'hover:bg-muted text-foreground' 
                : 'text-muted-foreground cursor-not-allowed'
            }`}
            aria-label="Previous audio"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlayPause}
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-1 rounded-full transition-colors ${
              canGoNext 
                ? 'hover:bg-muted text-foreground' 
                : 'text-muted-foreground cursor-not-allowed'
            }`}
            aria-label="Next audio"
          >
            <SkipForward size={18} />
          </button>
          <button
            onClick={() => skipForward(10)}
            className="p-1 rounded-full hover:bg-muted text-foreground transition-colors"
            aria-label="10 seconds forward"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={handleLike}
            className={`p-1 rounded-full ml-2 transition-colors ${liked ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-foreground'}`}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(progress)}
          </span>
          <div className="flex-1">
            <Slider
              value={[progress]}
              min={0}
              max={duration || 1}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
