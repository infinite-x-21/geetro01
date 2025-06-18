import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  audioUrl: string;
  coverUrl: string;
  title: string;
  artist: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  skipBack: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylistState] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update progress from audio tag
  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  };

  // On load, set duration and auto-play
  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  // Handle track ending
  const onEnded = () => {
    nextTrack();
  };

  // When track changes, reset progress/duration
  useEffect(() => {
    setProgress(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.load();
      // Don't reset isPlaying here to maintain continuous playback
    }
  }, [currentTrack?.audioUrl]);

  // Set up audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playTrack = (track: Track, newPlaylist?: Track[]) => {
    const wasPlaying = isPlaying;
    setCurrentTrack(track);
    if (newPlaylist) {
      setPlaylistState(newPlaylist);
      const index = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentTrackIndex(index >= 0 ? index : 0);
    } else {
      setPlaylistState([track]);
      setCurrentTrackIndex(0);
    }
    setIsPlaying(wasPlaying); // Maintain play state when changing tracks
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    
    // Loop back to start if at end
    const nextIndex = currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
    
    // Maintain play state
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const previousTrack = () => {
    if (playlist.length === 0) return;
    
    // Loop to end if at start
    const prevIndex = currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
    
    // Maintain play state
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const setPlaylist = (tracks: Track[], startIndex = 0) => {
    setPlaylistState(tracks);
    setCurrentTrackIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const skipForward = (seconds = 10) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + seconds, audioRef.current.duration);
  };

  const skipBack = (seconds = 10) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - seconds, 0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        currentTrackIndex,
        isPlaying,
        progress,
        duration,
        audioRef,
        playTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        seekTo,
        setPlaylist,
        skipBack,
        skipForward,
      }}
    >
      {children}
      <audio ref={audioRef} />
    </AudioPlayerContext.Provider>
  );
};
