import React, { useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, RotateCcw, RotateCw, ArrowLeft } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useNavigate } from 'react-router-dom';

interface ModernMusicPlayerCardProps {
  track?: any;
  onClose?: () => void;
}

export const ModernMusicPlayerCard: React.FC<ModernMusicPlayerCardProps> = ({ track, onClose }) => {
  const {
    currentTrack,
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
  const playingTrack = track || currentTrack;
  const [liked, setLiked] = React.useState(false);
  const navigate = useNavigate();
  const seekBarRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!playingTrack) return;
    const likedAudios = JSON.parse(localStorage.getItem('likedAudios') || '[]');
    setLiked(likedAudios.includes(playingTrack.id));
  }, [playingTrack]);

  const handleLike = () => {
    if (!playingTrack) return;
    let likedAudios = JSON.parse(localStorage.getItem('likedAudios') || '[]');
    if (likedAudios.includes(playingTrack.id)) {
      likedAudios = likedAudios.filter((id: string) => id !== playingTrack.id);
      setLiked(false);
    } else {
      likedAudios.push(playingTrack.id);
      setLiked(true);
    }
    localStorage.setItem('likedAudios', JSON.stringify(likedAudios));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!playingTrack) return null;

  // Fallback image
  const fallbackImg = "/lovable-uploads/default-audio-cover.png";
  const imageUrl = playingTrack.cover_image_url || playingTrack.coverUrl || fallbackImg;
  const title = playingTrack.title || 'Untitled';
  const artist = playingTrack.artist || playingTrack.uploaded_by || 'Unknown Artist';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
      <div
        className="relative rounded-3xl shadow-2xl flex flex-col items-center p-6 min-w-[320px] max-w-xs mx-auto"
        style={{
          background: 'linear-gradient(135deg, hsl(30, 15%, 12%) 60%, hsl(32, 15%, 18%) 100%)',
          boxShadow: '0 0 32px 8px rgba(255, 177, 60, 0.35), 0 2px 8px #0002',
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/stories'); }}
          className="absolute left-4 top-4 bg-black/60 hover:bg-amber-500/80 text-amber-400 hover:text-white rounded-full p-2 shadow border border-amber-400 transition"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        {/* Close button (optional) */}
        {onClose && (
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-primary text-xl">✕</button>
        )}
        {/* Album Art */}
        <div className="w-36 h-36 rounded-2xl overflow-hidden mb-4 shadow-lg relative flex items-center justify-center bg-muted mt-8">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={e => (e.currentTarget.src = fallbackImg)}
          />
        </div>
        {/* Like button */}
        <button
          onClick={handleLike}
          className={`mb-2 bg-black/60 rounded-full p-2 shadow ${liked ? 'text-amber-400' : 'text-muted-foreground'} transition-colors`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
        </button>
        {/* Track Info */}
        <div className="flex flex-col items-center justify-center w-full mb-2">
          <div className="text-base font-bold text-white text-center drop-shadow-lg truncate w-full" title={title}>{title}</div>
          <div className="text-xs text-muted-foreground text-center truncate w-full" title={artist}>{artist}</div>
        </div>
        {/* Seek Bar */}
        <div className="w-full flex flex-col items-center mb-2">
          <div className="flex items-center w-full gap-2">
            <span className="text-xs text-muted-foreground font-mono" style={{ minWidth: 36 }}>{formatTime(progress)}</span>
            <input
              ref={seekBarRef}
              type="range"
              min={0}
              max={duration || 1}
              value={progress}
              onChange={handleSeek}
              className="flex-1 accent-amber-500 h-2 rounded-lg bg-amber-900/30"
              style={{ accentColor: '#FFB13C' }}
            />
            <span className="text-xs text-muted-foreground font-mono" style={{ minWidth: 36 }}>{formatTime(duration)}</span>
          </div>
        </div>
        {/* Controls Row */}
        <div className="flex items-center justify-center gap-3 mt-2 mb-2">
          <button onClick={() => skipBack(10)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-amber-400 transition" style={{ width: 36, height: 36 }}><RotateCcw size={18} /></button>
          <button onClick={previousTrack} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-amber-400 transition" style={{ width: 36, height: 36 }}><SkipBack size={22} /></button>
          <button
            onClick={togglePlayPause}
            className={`p-4 rounded-full shadow-xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 text-white border-4 border-white/10 flex items-center justify-center transition-all duration-200 ${isPlaying ? 'animate-pulse' : ''}`}
            style={{ boxShadow: '0 0 32px 8px rgba(255, 177, 60, 0.35), 0 2px 8px #0002', width: 60, height: 60 }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button onClick={nextTrack} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-amber-400 transition" style={{ width: 36, height: 36 }}><SkipForward size={22} /></button>
          <button onClick={() => skipForward(10)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-amber-400 transition" style={{ width: 36, height: 36 }}><RotateCw size={18} /></button>
        </div>
      </div>
    </div>
  );
} 