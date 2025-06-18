
import React, { useState } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { MobilePlayerVariant } from "./MusicPlayer/MobilePlayerVariant";
import { DesktopPlayerVariant } from "./MusicPlayer/DesktopPlayerVariant";
import { createPlayerTrack } from "@/utils/audioUtils";
import { Track } from "@/types/Track";

interface MusicPlayerProps {
  audioUrl: string;
  coverUrl: string;
  title: string;
  artist: string;
  playlist?: Track[];
  initialTrackIndex?: number;
  variant?: "default" | "mobile-modal";
}

export default function MusicPlayer({
  audioUrl,
  coverUrl,
  title,
  artist,
  playlist,
  initialTrackIndex = 0,
  variant = "default",
}: MusicPlayerProps) {
  const { playTrack, currentTrack, isPlaying, togglePlayPause, progress, duration, seekTo } = useAudioPlayer();

  // Track for this player
  const track = createPlayerTrack(audioUrl, coverUrl, title, artist);

  // Check if this is the currently playing track
  const isCurrentTrack = currentTrack?.audioUrl === audioUrl;

  // State for playlist track index
  const [trackIndex, setTrackIndex] = useState<number>(initialTrackIndex);

  // What track do we play? Support old props or playlist
  const activeTrack = playlist
    ? playlist[trackIndex] ?? {
        audioUrl: "",
        coverUrl: "",
        title: "",
        artist: "",
      }
    : {
        audioUrl,
        coverUrl,
        title,
        artist,
      };

  // Handle play button - always use global player for synchronization
  const handleToggle = () => {
    const playlistTracks = playlist?.map((p, index) => 
      createPlayerTrack(p.audioUrl, p.coverUrl, p.title, p.artist, index)
    ) || [track];
    
    if (isCurrentTrack && currentTrack) {
      // If this is the current track, just toggle play/pause
      togglePlayPause();
    } else {
      // If this is a different track, play it
      playTrack(track, playlistTracks);
    }
  };

  // Seek when slider moves
  const handleSeek = (val: number[]) => {
    seekTo(val[0]);
  };

  // Seek for desktop variant
  const handleDesktopSeek = (time: number) => {
    seekTo(time);
  };

  // Next/Previous song navigation (playlist mode)
  const hasPlaylist = Array.isArray(playlist) && playlist.length > 1;
  const canGoPrev = hasPlaylist ? trackIndex > 0 : false;
  const canGoNext = hasPlaylist ? trackIndex < playlist!.length - 1 : false;

  const handlePrevSong = () => {
    if (!hasPlaylist) return;
    setTrackIndex((i) => (i > 0 ? i - 1 : i));
  };

  const handleNextSong = () => {
    if (!hasPlaylist) return;
    setTrackIndex((i) => (i < playlist!.length - 1 ? i + 1 : i));
  };

  // Use global state for consistent playback across all players
  const effectiveIsPlaying = isCurrentTrack ? isPlaying : false;
  const effectiveProgress = isCurrentTrack ? progress : 0;
  const effectiveDuration = isCurrentTrack ? duration : 0;

  const commonProps = {
    track: activeTrack,
    isPlaying: effectiveIsPlaying,
    progress: effectiveProgress,
    duration: effectiveDuration,
    onToggle: handleToggle,
    onPrevious: handlePrevSong,
    onNext: handleNextSong,
    canGoPrev,
    canGoNext,
    hasPlaylist,
  };

  if (variant === "mobile-modal") {
    return (
      <MobilePlayerVariant
        {...commonProps}
        onSeek={handleSeek}
      />
    );
  }

  return (
    <DesktopPlayerVariant
      {...commonProps}
      onSeek={handleDesktopSeek}
    />
  );
}
