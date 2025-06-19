import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import MusicPlayer from "@/components/MusicPlayer";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { ModernMusicPlayerCard } from "@/components/ModernMusicPlayerCard";
import HorizontalAudioScroll from "@/components/HorizontalAudioScroll";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

export default function StoryPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<AudioStoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudioPlayer();
  const [showSpinner, setShowSpinner] = useState(false);
  const [artistAudios, setArtistAudios] = useState<AudioStoryRow[]>([]);
  const [recommended, setRecommended] = useState<AudioStoryRow[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    (async () => {
      if (!id) return;
      setLoading(true);
      setShowSpinner(false);
      timer = setTimeout(() => setShowSpinner(true), 400);
      const { data, error } = await supabase
        .from("audio_stories")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        setStory(data as AudioStoryRow);
        // Auto play the track in the persistent player
        playTrack({
          id: data.id,
          audioUrl: data.audio_url,
          coverUrl: data.cover_image_url,
          title: data.title,
          artist: data.uploaded_by,
        });
      }
      setLoading(false);
      clearTimeout(timer);
      setShowSpinner(false);
    })();
    return () => clearTimeout(timer);
  }, [id, playTrack]);

  useEffect(() => {
    if (!story) return;
    // Fetch all songs by the same user (except current)
    supabase
      .from("audio_stories")
      .select("*")
      .eq("uploaded_by", story.uploaded_by)
      .neq("id", story.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setArtistAudios(data || []));
    // Fetch recommended (other users' songs, not current)
    supabase
      .from("audio_stories")
      .select("*")
      .neq("uploaded_by", story.uploaded_by)
      .neq("id", story.id)
      .order("likes", { ascending: false })
      .limit(12)
      .then(({ data }) => setRecommended(data || []));
  }, [story]);

  // Helper to map AudioStoryRow to AudioItem for HorizontalAudioScroll
  // (Type-only, do not import AudioItem, just inline the type)
  type AudioItem = {
    id: string;
    title: string;
    cover_image_url?: string | null;
    created_at?: string;
    artist_name?: string;
    likes?: number;
  };
  function mapToAudioItem(story: AudioStoryRow): AudioItem {
    return {
      id: story.id,
      title: story.title,
      cover_image_url: story.cover_image_url,
      created_at: story.created_at,
      artist_name: (story as any).artist_name || story.uploaded_by || "Unknown Artist",
      likes: (story as any).likes,
    };
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start w-full bg-background pb-10 relative">
      {/* Back Button */}
      <div className="w-full flex items-center sticky z-30 top-0 bg-transparent py-4 px-4">
        <button
          className="hover-scale rounded-lg bg-card px-3 py-2 flex items-center gap-2 text-primary font-semibold shadow border border-primary/30"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={22} />
          <span>Back</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[70vh]">
        {loading && showSpinner ? (
          <div className="mt-12 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin mb-2" size={32} />
            <div className="text-sm text-muted-foreground">Loading audio...</div>
          </div>
        ) : !story ? (
          <div className="mt-12 text-lg text-muted-foreground">Story not found.</div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center w-full">
              <ModernMusicPlayerCard track={story} />
            </div>
            {/* More from this artist */}
            {artistAudios.length > 0 && (
              <div className="w-full max-w-5xl mx-auto mt-10">
                <h3 className="text-xl font-bold mb-3 text-amber-300">More from this artist</h3>
                <HorizontalAudioScroll
                  title="More from this artist"
                  items={artistAudios.map(mapToAudioItem)}
                  onItemClick={item => navigate(`/stories/${item.id}`)}
                />
              </div>
            )}
            {/* Recommended section */}
            {recommended.length > 0 && (
              <div className="w-full max-w-5xl mx-auto mt-10">
                <h3 className="text-xl font-bold mb-3 text-amber-300">Recommended</h3>
                <HorizontalAudioScroll
                  title="Recommended"
                  items={recommended.map(mapToAudioItem)}
                  onItemClick={item => navigate(`/stories/${item.id}`)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
