import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, RotateCw, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Button } from './ui/button';
import { supabase } from "@/integrations/supabase/client";

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
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get current user ID for personalized liked audios
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!currentTrack || !userId) return;
    const likedKey = `likedAudios_${userId}`;
    const likedAudios = JSON.parse(localStorage.getItem(likedKey) || '[]');
    setLiked(likedAudios.includes(currentTrack.id));
  }, [currentTrack, userId]);

  const handleLike = () => {
    if (!currentTrack || !userId) return;
    const likedKey = `likedAudios_${userId}`;
    let likedAudios = JSON.parse(localStorage.getItem(likedKey) || '[]');
    if (likedAudios.includes(currentTrack.id)) {
      likedAudios = likedAudios.filter((id: string) => id !== currentTrack.id);
      setLiked(false);
    } else {
      likedAudios.push(currentTrack.id);
      setLiked(true);
    }
    localStorage.setItem(likedKey, JSON.stringify(likedAudios));
  };

  if (!currentTrack) return null;

  const handleSeek = (val: number[]) => {
    seekTo(val[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if we can go next/previous in the playlist
  const canGoPrev = playlist.length > 1 && currentTrackIndex > 0;
  const canGoNext = playlist.length > 1 && currentTrackIndex < playlist.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center gap-4 px-4 py-3 max-w-6xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                <Play size={20} className="text-amber-400" />
              </div>
            )}
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
        <div className="flex items-center gap-3">
          {/* Skip Back 10s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipBack(10)}
            className="text-amber-400 hover:text-amber-300"
          >
            <RotateCcw size={18} />
          </Button>

          {/* Previous Track */}
          <Button
            variant="ghost"
            size="sm"
            onClick={previousTrack}
            disabled={!canGoPrev}
            className={`text-amber-400 hover:text-amber-300 ${!canGoPrev && 'opacity-50'}`}
          >
            <SkipBack size={18} />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="bg-amber-500 hover:bg-amber-600 text-white w-10 h-10 rounded-full"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
          </Button>

          {/* Next Track */}
          <Button
            variant="ghost"
            size="sm"
            onClick={nextTrack}
            disabled={!canGoNext}
            className={`text-amber-400 hover:text-amber-300 ${!canGoNext && 'opacity-50'}`}
          >
            <SkipForward size={18} />
          </Button>

          {/* Skip Forward 10s */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipForward(10)}
            className="text-amber-400 hover:text-amber-300"
          >
            <RotateCw size={18} />
          </Button>

          {/* Like Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`${liked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-400`}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-[2] flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
