import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Heart } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

interface AudioStoryFeedProps {
  search?: string;
  category?: string;
  sortBy?: "latest" | "oldest" | "most-liked";
}

export default function AudioStoryFeed({ search = "", category = "all", sortBy = "latest" }: AudioStoryFeedProps) {
  const [stories, setStories] = useState<AudioStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Build the query
        let query = supabase.from("audio_stories").select("id, title, category, audio_url, created_at, cover_image_url, uploaded_by");

        // Apply category filter
        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        // Apply search filter
        if (search) {
          query = query.ilike("title", `%${search}%`);
        }

        // Apply sorting
        switch (sortBy) {
          case "oldest":
            query = query.order("created_at", { ascending: true });
            break;
          case "most-liked":
            query = query.order("likes", { ascending: false });
            break;
          case "latest":
          default:
            query = query.order("created_at", { ascending: false });
            break;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (data) {
          // Get unique uploader IDs
          const uploaderIds = [...new Set(data.map(story => story.uploaded_by))];
          
          // Fetch artist names
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", uploaderIds);

          // Create a map of user IDs to names
          const artistNames = new Map(profiles?.map(p => [p.id, p.name]) || []);

          // Add artist names to stories
          const storiesWithArtists = data.map(story => ({
            ...story,
            artist_name: artistNames.get(story.uploaded_by) || "Unknown Artist"
          }));

          setStories(storiesWithArtists);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching stories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [search, category, sortBy]);

  // Section label logic
  let sectionLabel = "All";
  if (category && category !== "all") {
    sectionLabel = category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Click cover image to open story player page
  const handleSelect = (story: AudioStoryRow) => {
    if (!story.id) return;
    navigate(`/stories/${story.id}`);
  };

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

  if (stories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No audio stories found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {stories.map((story) => (
        <div
          key={story.id}
          onClick={() => handleSelect(story)}
          className="group relative flex items-center gap-4 p-3 rounded-lg border border-amber-500/10 hover:border-amber-500/30 bg-card/30 hover:bg-card/60 transition-all duration-200 cursor-pointer"
        >
          {/* Cover Image */}
          <div className="relative w-[120px] aspect-[4/3] flex-shrink-0 rounded-md overflow-hidden bg-muted">
            {story.cover_image_url ? (
              <img
                src={story.cover_image_url}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <Play size={24} className="text-amber-400" />
              </div>
            )}
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Play size={24} className="text-white transform scale-90 group-hover:scale-100 transition-transform duration-200" />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
            <div>
              <h3 className="font-medium text-base truncate mb-0.5">{story.title}</h3>
              <p className="text-sm text-muted-foreground/80 truncate">{story.artist_name}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground/70">
                {new Date(story.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground/70">
                <Heart size={13} className="group-hover:text-amber-500/70 transition-colors duration-200" />
                <span className="text-xs">{story.likes || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}