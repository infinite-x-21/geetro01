import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Play, Calendar, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type VideoStoryRow = Database["public"]["Tables"]["video_stories"]["Row"];

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoStoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllVideos();
  }, []);

  const fetchAllVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("video_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/${videoId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">All Videos</h1>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">No videos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {video.wallpaper_url ? (
                      <img
                        src={video.wallpaper_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                        <Play size={48} className="text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={32} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(video.created_at || "")}</span>
                      </div>
                      
                      {video.category && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {video.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}