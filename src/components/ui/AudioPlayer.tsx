import { useEffect, useRef } from "react";
import { useAudioStore } from "@/lib/audioStore";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import classNames from "classnames";

const AudioPlayer = () => {
  const { current, isPlaying, togglePlay, setPlaying } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [isPlaying]);

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0f1117] border-t border-gray-800 px-4 py-3 z-50">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Left: Song Info */}
        <div className="flex items-center gap-4">
          <img src={current.image} alt={current.title} className="w-12 h-12 rounded-md object-cover" />
          <div>
            <div className="text-white font-semibold text-sm">{current.title}</div>
            <div className="text-gray-400 text-xs">{current.artist}</div>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-6">
          <button><SkipBack size={20} className="text-gray-300" /></button>
          <button onClick={togglePlay}>
            {isPlaying ? (
              <Pause size={28} className="text-white" />
            ) : (
              <Play size={28} className="text-white" />
            )}
          </button>
          <button><SkipForward size={20} className="text-gray-300" /></button>
        </div>

        {/* Right: Wave / Progress */}
        <div className="flex-1 hidden md:flex justify-end">
          <input
            type="range"
            min={0}
            max={audioRef.current?.duration || 100}
            value={audioRef.current?.currentTime || 0}
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = Number(e.target.value);
              }
            }}
            className="w-48 h-1 bg-gray-700 rounded-full accent-blue-500"
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={current.src}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
};

export default AudioPlayer;
