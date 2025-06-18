import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
// import AudioPlayerModal from "./AudioPlayerModal"; // No longer used here

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

interface AudioStoryFeedProps {
  search?: string;
  category?: string;
}

export default function AudioStoryFeed({ search = "", category = "all" }: AudioStoryFeedProps) {
  const [stories, setStories] = useState<AudioStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("audio_stories")
        .select("id, title, category, audio_url, created_at, cover_image_url, uploaded_by")
        .order("created_at", { ascending: false })
        .limit(30);

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      let filtered: AudioStoryRow[] = [];
      if (!error && data) {
        filtered = (data as AudioStoryRow[]);
        if (search) {
          filtered = filtered.filter(story =>
            (story.title || "").toLowerCase().includes(search.toLowerCase())
          );
        }
      }
      setStories(filtered);
      setLoading(false);
    })();
  }, [search, category]);

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

  return (
    <div className="flex flex-col w-full items-start">
      <h2 className="text-2xl font-bold mb-4 w-full text-left max-w-2xl">
        {sectionLabel} {search && <>/ <span className="font-normal">Search: {search}</span></>}
      </h2>
      {loading ? (
        <div className="text-center w-full">Loading...</div>
      ) : stories.length === 0 ? (
        <div className="text-center text-muted-foreground w-full">
          No {sectionLabel.toLowerCase()} found.
        </div>
      ) : (
        <div className="flex flex-row gap-4 w-full overflow-x-auto no-scrollbar pb-2">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center min-w-[96px]">
              <button
                onClick={() => handleSelect(story)}
                className="rounded-xl overflow-hidden bg-muted/60 flex-shrink-0 focus:outline-none hover-scale transition"
                style={{
                  width: 96,
                  height: 96,
                  minWidth: 96,
                  minHeight: 96,
                  maxWidth: 96,
                  maxHeight: 96,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(120,255,189,0.18)",
                  boxShadow: "0 1.5px 10px 0 rgba(38,255,171,0.08)",
                  background: "#232B35",
                  cursor: "pointer"
                }}
                aria-label={story.title || "Story cover"}
                tabIndex={0}
              >
                {story.cover_image_url ? (
                  <img
                    src={story.cover_image_url}
                    alt={story.title + " cover"}
                    className="object-cover w-full h-full"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted border border-dashed rounded-xl">
                    No Image
                  </div>
                )}
              </button>
              <div
                className="w-full text-xs text-center mt-1 text-neutral-200 font-medium truncate"
                title={story.title || ""}
                style={{ maxWidth: 96 }}
              >
                {story.title || ""}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal removed—navigation used instead */}
    </div>
  );
}