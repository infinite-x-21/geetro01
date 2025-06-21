
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { SyncedPlayer } from "@/components/listen-together/SyncedPlayer";
import { SessionParticipants } from "@/components/listen-together/SessionParticipants";

export default function ListenTogetherPage() {
  const [user, setUser] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
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
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="bg-background min-h-screen relative pb-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <Navbar />
          <div className="max-w-6xl mx-auto pt-6 px-4">
            <div className="rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon backdrop-blur-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Invalid Session</h2>
              <p className="text-muted-foreground">No listening session specified.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen relative pb-20">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-6 px-4">
          <div className="rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon backdrop-blur-sm p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              <div className="lg:col-span-2">
                <SyncedPlayer sessionId={sessionId} userId={user.id} />
              </div>
              <div>
                <SessionParticipants sessionId={sessionId} currentUserId={user.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}