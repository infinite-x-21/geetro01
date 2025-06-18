import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Heart, TrendingUp, ChevronRight } from "lucide-react";
import type { Database } from "@/types/database.types";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"] & {
  artist_name?: string;
};

interface AudioStoryFeedProps {
  search?: string;
  category?: string;
}

export default function AudioStoryFeed({ search = "", category = "all" }: AudioStoryFeedProps) {
  const [trendingStories, setTrendingStories] = useState<AudioStoryRow[]>([]);
  const [moreStories, setMoreStories] = useState<AudioStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build the queries for both trending and more stories
        const trendingQuery = supabase
          .from("audio_stories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        const moreQuery = supabase
          .from("audio_stories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        // Apply category filter if needed
        if (category && category !== "all") {
          trendingQuery.eq("category", category);
          moreQuery.eq("category", category);
        }

        // Apply search filter if needed
        if (search) {
          trendingQuery.ilike("title", `%${search}%`);
          moreQuery.ilike("title", `%${search}%`);
        }

        const [trendingResult, moreResult] = await Promise.all([
          trendingQuery,
          moreQuery
        ]);

        if (trendingResult.error) throw trendingResult.error;
        if (moreResult.error) throw moreResult.error;

        // Get all unique uploader IDs from both sets
        const uploaderIds = [...new Set([
          ...(trendingResult.data?.map(story => story.uploaded_by) || []),
          ...(moreResult.data?.map(story => story.uploaded_by) || [])
        ])];

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

        setTrendingStories(processStories(trendingResult.data || []));
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

  const renderStoryCard = (story: AudioStoryRow, variant: 'trending' | 'more' = 'more') => (
    <div
      key={story.id}
      onClick={() => handleSelect(story)}
      className={`group cursor-pointer transition-all duration-200 ${
        variant === 'trending'
          ? 'flex-shrink-0 w-[200px]'
          : 'flex items-center gap-4 p-3 rounded-lg border border-amber-500/10 hover:border-amber-500/30 bg-card/30 hover:bg-card/60'
      }`}
    >
      {/* Cover Image */}
      <div 
        className={`relative overflow-hidden bg-muted ${
          variant === 'trending'
            ? 'aspect-square rounded-lg mb-3'
            : 'w-[120px] aspect-[4/3] flex-shrink-0 rounded-md'
        }`}
      >
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
            <Play size={variant === 'trending' ? 32 : 24} className="text-amber-400" />
          </div>
        )}
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Play 
            size={variant === 'trending' ? 32 : 24} 
            className="text-white transform scale-90 group-hover:scale-100 transition-transform duration-200"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className={`min-w-0 ${variant === 'trending' ? '' : 'flex-grow flex flex-col justify-between py-1'}`}>
        <div>
          <h3 className="font-medium text-base truncate mb-0.5">{story.title}</h3>
          <p className="text-sm text-muted-foreground/80 truncate">{story.artist_name}</p>
        </div>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground/70">
          <Heart size={13} className="group-hover:text-amber-500/70 transition-colors duration-200" />
          <span className="text-xs">{story.likes || 0}</span>
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

  if (trendingStories.length === 0 && moreStories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No audio stories found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trending Section */}
      {trendingStories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              <h2 className="text-xl font-semibold">Trending Audios</h2>
            </div>
            <button 
              onClick={() => navigate('/trending')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-500 transition-colors"
            >
              See all <ChevronRight size={16} />
            </button>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent hover:scrollbar-thumb-amber-500/30">
              {trendingStories.map(story => renderStoryCard(story, 'trending'))}
            </div>
          </div>
        </section>
      )}

      {/* More Section */}
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
          <div className="grid gap-3">
            {moreStories.map(story => renderStoryCard(story, 'more'))}
          </div>
        </section>
      )}
    </div>
  );
}