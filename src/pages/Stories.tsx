
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioStoryFeed from "@/components/AudioStoryFeed";
import VideoStoryFeed from "@/components/VideoStoryFeed";
import VideoStoryUpload from "@/components/VideoStoryUpload";

import AudioStoryUpload from "@/components/AudioStoryUpload";
import Navbar from "@/components/Navbar";
import StoriesHeroSection from "@/components/StoriesHeroSection";
import { supabase } from "@/integrations/supabase/client";

export default function StoriesPage() {
  const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"audio" | "video">("audio");

  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/auth");
      setUser(data.user);
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  // Refetch stories on upload
  const [refreshFeed, setRefreshFeed] = useState(0);

  return (
     <div className="bg-background min-h-screen relative pb-20">
      {/* Background pattern overlay - adding bottom padding for audio player */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <StoriesHeroSection />
        
        {/* Tab Navigation */}
        <div className="max-w-3xl mx-auto pt-6 px-4">
          <div className="flex justify-center mb-6">
            <div className="bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("audio")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "audio"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Audio Stories
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "video"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Video Stories
              </button>
            </div>
          </div>

          {/* Upload Section */}
           {user && (
            <div className="mb-8 rounded-lg p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 shadow-neon backdrop-blur-sm">
              {activeTab === "audio" ? (
                <AudioStoryUpload onUpload={() => setRefreshFeed(x => x + 1)} />
              ) : (
                <VideoStoryUpload onUpload={() => setRefreshFeed(x => x + 1)} />
              )}            </div>
          )}
          
          {/* Feed Section */}
          <div className="rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon backdrop-blur-sm p-6">
            {activeTab === "audio" ? (
              <AudioStoryFeed key={`audio-${refreshFeed}`} />
            ) : (
              <VideoStoryFeed key={`video-${refreshFeed}`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
