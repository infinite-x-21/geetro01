import React from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Play, Pause, SkipForward, SkipBack, X, Heart, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface NowPlayingModalProps {
  open: boolean;
  onClose: () => void;
}

const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ open, onClose }) => {
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
    playTrack,
  } = useAudioPlayer();

  const [liked, setLiked] = React.useState(false);
  React.useEffect(() => { setLiked(false); }, [currentTrack]);

  if (!open || !currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canGoPrev = playlist.length > 1 && currentTrackIndex > 0;
  const canGoNext = playlist.length > 1 && currentTrackIndex < playlist.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-lg mx-auto bg-gradient-to-br from-amber-900/80 to-orange-900/80 rounded-3xl shadow-2xl p-8 border border-amber-400/30">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-amber-200 hover:text-amber-400 text-2xl"
          onClick={onClose}
        >
          <X size={28} />
        </button>
        {/* Main Song Player */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg mb-4 border-4 border-amber-400/30">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                <Play size={40} className="text-amber-400" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-amber-100 mb-1 truncate w-full text-center" title={currentTrack.title}>{currentTrack.title}</h2>
          <p className="text-lg text-amber-200/80 mb-4 truncate w-full text-center">{currentTrack.artist}</p>
          {/* Player Controls */}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => skipBack(10)} className="text-amber-300 hover:text-amber-400 text-xl">
              <RotateCcw size={26} />
            </button>
            <button onClick={previousTrack} className="text-amber-300 hover:text-amber-400 text-2xl disabled:opacity-40" disabled={!canGoPrev}>
              <SkipBack size={32} />
            </button>
            <button onClick={togglePlayPause} className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
              {isPlaying ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-amber-300 hover:text-amber-400 text-2xl disabled:opacity-40" disabled={!canGoNext}>
              <SkipForward size={32} />
            </button>
            <button onClick={() => skipForward(10)} className="text-amber-300 hover:text-amber-400 text-xl">
              <RotateCw size={26} />
            </button>
            <button onClick={() => setLiked(l => !l)} className={liked ? 'text-red-500' : 'text-muted-foreground'}>
              <Heart size={28} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          {/* Seek Bar */}
          <div className="flex items-center gap-2 w-full mt-4">
            <span className="text-xs text-amber-200/70 w-10 text-right">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              max={duration}
              step={1}
              onValueChange={val => seekTo(val[0])}
              className="flex-1"
            />
            <span className="text-xs text-amber-200/70 w-10">{formatTime(duration)}</span>
          </div>
        </div>
        {/* Up Next Playlist */}
        <div className="bg-black/30 rounded-xl p-4 max-h-64 overflow-y-auto shadow-inner">
          <h3 className="text-lg font-semibold text-amber-200 mb-3">Up Next</h3>
          <ul className="space-y-2">
            {playlist.map((track, idx) => (
              <li
                key={track.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${idx === currentTrackIndex ? 'bg-amber-500/20 border border-amber-400/30' : 'hover:bg-amber-500/10'}`}
                onClick={() => playTrack(track, playlist)}
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-500/10">
                      <Play size={18} className="text-amber-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-base truncate text-amber-100">{track.title}</h4>
                  <p className="text-xs text-amber-200/80 truncate">{track.artist}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingModal;
