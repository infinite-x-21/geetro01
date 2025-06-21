
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Music, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import FollowersList from "@/components/FollowerLists";
import type { Database } from "@/integrations/supabase/types";
import FriendRequestButton from "@/components/FriendRequestButton";
import { useFriendshipStatus } from "@/hooks/useFriendshipStatus";
type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface UserStats {
  followers_count: number;
  following_count: number;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ followers_count: 0, following_count: 0 });
  const [audioStories, setAudioStories] = useState<AudioStoryRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();
  const { status: friendshipStatus, refreshStatus } = useFriendshipStatus(currentUserId, userId || "");

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // If viewing own profile, redirect to profile page
        if (user?.id === userId) {
          navigate("/profile");
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user stats
        const { data: statsData } = await supabase
          .rpc("get_user_stats", { user_id: userId }) as { data: { followers_count: number; following_count: number }[] };
        
        if (statsData?.[0]) {
          setStats({
            followers_count: statsData[0].followers_count,
            following_count: statsData[0].following_count,
          });
        }

      

        // Fetch user's audio stories
        const { data: audioData, error: audioError } = await supabase
          .from("audio_stories")
          .select("*")
          .eq("uploaded_by", userId)
          .order("created_at", { ascending: false });

        if (!audioError && audioData) {
          setAudioStories(audioData);
        }

      } catch (error: any) {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        });
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, navigate, toast]);


  const handlePlayStory = (story: AudioStoryRow) => {
    const track = {
      id: story.id,
      audioUrl: story.audio_url || "",
      coverUrl: story.cover_image_url || "",
      title: story.title || "",
      artist: profile?.name || "Unknown Artist",
    };
    
    const playlist = audioStories.map(s => ({
      id: s.id,
      audioUrl: s.audio_url || "",
      coverUrl: s.cover_image_url || "",
      title: s.title || "",
      artist: profile?.name || "Unknown Artist",
    }));
    
    playTrack(track, playlist);
      };

  const startChat = () => {
    if (userId) {
      navigate(`/chat?user=${userId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button onClick={() => navigate("/home")}>Go back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Back button */}
        <div className="w-full flex mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-card p-8 rounded-xl shadow border border-primary/10 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-primary">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name || "User"} />
              ) : (
                <AvatarFallback className="text-3xl bg-muted">
                  {getInitials(profile.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profile.name || "Anonymous User"}</h1>
              <div className="flex items-center justify-center md:justify-start gap-6 text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {stats.followers_count} followers
                </span>
                <span>{stats.following_count} following</span>
              </div>
              
              {currentUserId && (
                   <div className="flex gap-2 justify-center md:justify-start">
                  <FriendRequestButton
                    targetUserId={userId!}
                    currentUserId={currentUserId}
                    friendshipStatus={friendshipStatus}
                    onStatusChange={refreshStatus}
                  />
                  {friendshipStatus === "friends" && (
                    <Button
                      onClick={startChat}
                      variant="outline"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Followers and Following Section */}
        <div className="bg-card p-6 rounded-xl shadow border border-primary/10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold">Community</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Followers</h3>
              <FollowersList 
                userId={userId!} 
                currentUserId={currentUserId}
                type="followers"
                count={stats.followers_count}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Following</h3>
              <FollowersList 
                userId={userId!} 
                currentUserId={currentUserId}
                type="following"
                count={stats.following_count}
              />
            </div>
          </div>
        </div>

        {/* Audio Stories Section */}
        <div className="bg-card p-6 rounded-xl shadow border border-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <Music className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold">Audio Stories</h2>
          </div>
          
          {audioStories.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Music size={48} className="mx-auto mb-4 opacity-50" />
              <p>No audio stories uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audioStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-muted/30 rounded-lg p-4 border hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => handlePlayStory(story)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={32} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm truncate mb-1" title={story.title}>
                    {story.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {story.category || "Uncategorized"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(story.created_at || "").toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
