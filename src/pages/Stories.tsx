
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioStoryFeed from "@/components/AudioStoryFeed";
import AudioStoryUpload from "@/components/AudioStoryUpload";
import Navbar from "@/components/Navbar";
import StoriesHeroSection from "@/components/StoriesHeroSection";
import { supabase } from "@/integrations/supabase/client";

export default function StoriesPage() {
  const [user, setUser] = useState<any>(null);
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
    <div className="bg-background min-h-screen relative">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <StoriesHeroSection />
        <div className="max-w-3xl mx-auto pt-6 px-4">
          {user && (
            <div className="mb-8 rounded-lg p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 shadow-neon backdrop-blur-sm">
              <AudioStoryUpload onUpload={() => setRefreshFeed(x => x + 1)} />
            </div>
          )}
          <div className="rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon backdrop-blur-sm">
            <AudioStoryFeed key={refreshFeed} />
          </div>
        </div>
      </div>
    </div>
  );
}
