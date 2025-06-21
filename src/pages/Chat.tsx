
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

  return (
    <div className="bg-background min-h-screen relative pb-20">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-6 px-4">
          <div className="rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 shadow-neon backdrop-blur-sm">
            <div className="flex h-[600px]">
              <div className="w-1/3 border-r border-amber-500/20">
                <ChatList 
                  currentUserId={user.id}
                  onSelectUser={setSelectedUserId}
                  selectedUserId={selectedUserId}
                />
              </div>
              <div className="flex-1">
                {selectedUserId ? (
                  <ChatWindow 
                    currentUserId={user.id}
                    otherUserId={selectedUserId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a user to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
