
import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerComponentProps {
  videoUrl: string;
  wallpaperUrl?: string;
  title: string;
  youtubeUrl?: string;
}

export default function VideoPlayerComponent({
  videoUrl,
  wallpaperUrl,
  title,
  youtubeUrl
}: VideoPlayerComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // If it's a YouTube URL, extract video ID and create embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1` : url;
  };

  const isYouTubeVideo = youtubeUrl || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTubeVideo) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => {
      if (isLooping) {
        setLoopCount(prev => prev + 1);
        video.currentTime = 0;
        video.play();
      } else {
        setIsPlaying(false);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isLooping]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const resetLoopCount = () => {
    setLoopCount(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isYouTubeVideo) {
    const embedUrl = getYouTubeEmbedUrl(youtubeUrl || videoUrl);
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          YouTube videos have their own built-in controls for playback speed and looping.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
      
      <div 
        className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoUrl}
          poster={wallpaperUrl}
          onClick={togglePlay}
        />
        
        {/* Video Controls Overlay */}
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="text-white hover:bg-white/20 rounded-full p-4"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full mb-2"
          />
          <div className="flex items-center justify-between text-white text-sm">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>{playbackRate}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="mt-6 space-y-4">
        {/* Playback Speed */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Playback Speed:</label>
          <div className="flex gap-2">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                className="text-xs"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>

        {/* Loop Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="loop"
              checked={isLooping}
              onChange={(e) => setIsLooping(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="loop" className="text-sm font-medium">Loop Video</label>
          </div>
          {isLooping && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Loops: {loopCount}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLoopCount}
                className="text-xs"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
