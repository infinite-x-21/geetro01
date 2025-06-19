import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ChevronRight, Play } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Database } from "@/types/database.types";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"] & {
  artist_name?: string;
};

interface AudioStoryFeedProps {
  search?: string;
  category?: string;
}

export default function AudioStoryFeed({ search = "", category = "all" }: AudioStoryFeedProps) {
  const [moreStories, setMoreStories] = useState<AudioStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { playTrack } = useAudioPlayer();

  // For preview audio refs
  const previewRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build the query for more stories
        const moreQuery = supabase
          .from("audio_stories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        // Apply category filter if needed
        if (category && category !== "all") {
          moreQuery.eq("category", category);
        }

        // Apply search filter if needed
        if (search) {
          moreQuery.ilike("title", `%${search}%`);
        }

        const moreResult = await moreQuery;

        if (moreResult.error) throw moreResult.error;

        // Get all unique uploader IDs from the set
        const uploaderIds = [...new Set(moreResult.data?.map(story => story.uploaded_by) || [])];

        // Fetch artist names
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", uploaderIds);

        // Create a map of user IDs to names
        const artistNames = new Map(profiles?.map(p => [p.id, p.name]) || []);

        // Add artist names to stories
        const processStories = (stories: AudioStoryRow[]) =>
          stories.map(story => ({
            ...story,
            artist_name: artistNames.get(story.uploaded_by) || "Unknown Artist"
          }));

        setMoreStories(processStories(moreResult.data || []));
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching stories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [search, category]);

  const handleSelect = (story: AudioStoryRow) => {
    if (!story.id) return;
    navigate(`/stories/${story.id}`);
  };

  // Helper to map AudioStoryRow to Track
  const mapStoryToTrack = (story: AudioStoryRow) => ({
    id: story.id,
    audioUrl: story.audio_url,
    coverUrl: story.cover_image_url,
    title: story.title,
    artist: story.artist_name || "Unknown Artist",
  });

  // Play the selected story in the bottom audio player
  const handlePlayStory = (story: AudioStoryRow) => {
    const playlist = moreStories.map(mapStoryToTrack);
    const track = mapStoryToTrack(story);
    playTrack(track, playlist);
  };

  const renderStoryCard = (story: AudioStoryRow, variant: 'trending' | 'more' = 'more') => (
    <div
      key={story.id}
      className={`group cursor-pointer transition-all duration-200 select-none
        flex-shrink-0 w-[210px] rounded-2xl shadow-md
        bg-zinc-900/80 hover:shadow-xl hover:scale-[1.04] border border-transparent hover:border-amber-400/60 p-3 flex flex-col items-stretch relative`
      }
      style={{ minWidth: 210 }}
      onClick={() => handleSelect(story)}
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden bg-zinc-800 aspect-square rounded-xl mb-3 shadow-sm">
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
            <Play size={32} className="text-amber-400" />
          </div>
        )}
      </div>
      {/* Info Section */}
      <div className="min-w-0">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-base truncate mb-0.5 text-zinc-100">{story.title}</h3>
          <p className="text-sm text-muted-foreground/90 truncate">{story.artist_name}</p>
        </div>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground/70">
          <Heart size={14} className="group-hover:text-amber-500/70 transition-colors duration-200" />
          <span className="text-xs font-medium">{story.likes || 0}</span>
          <span className="text-xs ml-auto text-zinc-400 dark:text-zinc-500">{story.created_at ? new Date(story.created_at).toLocaleDateString() : ''}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <p>Error loading stories: {error}</p>
      </div>
    );
  }

  if (moreStories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No audio stories found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* More Section - now horizontal */}
      {moreStories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">More For You</h2>
            <button 
              onClick={() => navigate('/explore')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-500 transition-colors"
            >
              Explore more <ChevronRight size={16} />
            </button>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent hover:scrollbar-thumb-amber-500/30">
              {moreStories.map(story => renderStoryCard(story, 'more'))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}