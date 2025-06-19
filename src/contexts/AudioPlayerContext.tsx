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

  // On load, set duration
  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  // // When track changes, reset progress/duration
  // useEffect(() => {
  //   setProgress(0);
  //   setDuration(0);
  //   if (audioRef.current) {
  //     audioRef.current.load();
  //     setIsPlaying(false);
  //   }
  // }, [currentTrack?.audioUrl]);
  
  // Handle track end - autoplay next track
  const onTrackEnded = () => {
    console.log('Track ended, attempting to play next track');
    if (playlist.length > 1 && currentTrackIndex < playlist.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      setCurrentTrack(playlist[nextIndex]);
      // Auto-play will be handled by the useEffect below
    } else {
      setIsPlaying(false);
    }
  };

  // When track changes, reset progress/duration and auto-play if was playing
  useEffect(() => {
    setProgress(0);
    setDuration(0);
    if (audioRef.current && currentTrack) {
      audioRef.current.load();
      // Auto-play the new track if we were playing
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack?.audioUrl]);

  // Auto-play effect for seamless transitions
  useEffect(() => {
    if (audioRef.current && currentTrack && isPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrack, isPlaying]);

  // Auto-next: advance to next track when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      if (playlist.length > 0 && currentTrackIndex < playlist.length - 1) {
        setCurrentTrackIndex(idx => {
          const nextIdx = idx + 1;
          setCurrentTrack(playlist[nextIdx]);
          return nextIdx;
        });
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playlist, currentTrackIndex, audioRef]);

  const playTrack = (track: Track, newPlaylist?: Track[]) => {
    setCurrentTrack(track);
    if (newPlaylist) {
      setPlaylistState(newPlaylist);
      const index = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentTrackIndex(index >= 0 ? index : 0);
    } else {
      setPlaylistState([track]);
      setCurrentTrackIndex(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (playlist.length === 0 || currentTrackIndex >= playlist.length - 1) return;
    const nextIndex = currentTrackIndex + 1;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
        // Keep playing state for seamless transition

  };

  const previousTrack = () => {
    if (playlist.length === 0 || currentTrackIndex <= 0) return;
    const prevIndex = currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
        // Keep playing state for seamless transition

  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const setPlaylist = (tracks: Track[], startIndex: number = 0) => {
    setPlaylistState(tracks);
    setCurrentTrackIndex(startIndex);
    if (tracks.length > startIndex) {
      setCurrentTrack(tracks[startIndex]);
    }
  };

  const skipBack = (seconds: number = 10) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, audioRef.current.currentTime - seconds);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const skipForward = (seconds: number = 10) => {
    if (!audioRef.current) return;
    const newTime = Math.min(duration, audioRef.current.currentTime + seconds);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
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
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audioUrl}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onTrackEnded}
          className="hidden"
          preload="metadata"

        />
      )}
    </AudioPlayerContext.Provider>
  );
};
