import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LikedAudiosPage() {
  const [likedAudios, setLikedAudios] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setLikedAudios([]);
      return;
    }
    const likedKey = `likedAudios_${userId}`;
    const likedIds = JSON.parse(localStorage.getItem(likedKey) || '[]');
    if (likedIds.length === 0) {
      setLikedAudios([]);
      return;
    }
    supabase
      .from('audio_stories')
      .select('id, title, audio_url, cover_image_url, category, created_at, uploaded_by')
      .in('id', likedIds)
      .then(({ data, error }) => {
        if (!error && data) setLikedAudios(data);
        else setLikedAudios([]);
      });
  }, [userId]);

  const handlePlay = (audio: any) => {
    playTrack({
      id: audio.id,
      audioUrl: audio.audio_url,
      coverUrl: audio.cover_image_url,
      title: audio.title,
      artist: audio.uploaded_by || "Unknown Artist",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start w-full bg-background pb-20 pt-8 animate-fade-in relative">
      {/* Decorative left side icons */}
      <div className="absolute left-0 top-0 h-full w-24 flex flex-col items-center justify-around opacity-30 pointer-events-none">
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      {/* Decorative right side icons */}
      <div className="absolute right-0 top-0 h-full w-24 flex flex-col items-center justify-around opacity-30 pointer-events-none">
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
        <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div className="w-full max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-amber-400/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-500 font-semibold shadow transition"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-full bg-amber-500/20 audio-glow">
            <Heart className="text-amber-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-amber-200">Your Liked Audios</h1>
        </div>
        {likedAudios.length === 0 ? (
          <div className="text-muted-foreground text-center mt-16">You haven't liked any audio yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {likedAudios.map(audio => (
              <div
                key={audio.id}
                className="flex items-center gap-4 bg-card rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer group"
                onClick={() => handlePlay(audio)}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {audio.cover_image_url ? (
                    <img src={audio.cover_image_url} alt={audio.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-2xl">🎵</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-100 truncate" title={audio.title}>{audio.title}</div>
                  <div className="text-xs text-muted-foreground truncate" title={audio.category}>{audio.category}</div>
                  <div className="text-xs text-muted-foreground truncate" title={audio.uploaded_by}>{audio.uploaded_by}</div>
                </div>
                <button
                  className="ml-2 px-3 py-1 rounded bg-amber-500/20 text-amber-400 font-bold text-xs group-hover:bg-amber-500/40 transition"
                  onClick={e => { e.stopPropagation(); handlePlay(audio); }}
                >
                  Play
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}