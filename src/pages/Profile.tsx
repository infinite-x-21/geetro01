import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User as UserIcon, Loader2, Plus, ArrowLeft, Trash2, Users, Music, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import FollowersList from "@/components/FollowerLists";
import { cn } from "@/lib/utils";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

// Stats Card Component
function StatsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

interface UserStats {
  totalUploads: number;
  joinDate: string;
  followers: number;
  following: number;
}

// Util for initials
function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [userAudioStories, setUserAudioStories] = useState<AudioStoryRow[]>([]);
  const [editName, setEditName] = useState("");
  const [userStats, setUserStats] = useState<UserStats>({
    totalUploads: 0,
    joinDate: "",
    followers: 0,
    following: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user stats
  const fetchUserStats = async (userId: string) => {
    try {
      // Get follower counts
      const { data: stats } = await supabase
        .rpc('get_user_stats', { user_id: userId });
      
      // Get join date from first upload or profile creation
      const { data: profile } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', userId)
        .single();
      
      const joinDate = profile?.updated_at || new Date().toISOString();
      
      setUserStats({
        totalUploads: userAudioStories.length,
        joinDate,
        followers: stats?.[0]?.followers_count ?? 0,
        following: stats?.[0]?.following_count ?? 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Fetch user and profile data
  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (!error && data) {
          setProfile(data);
          setEditName(data.name || "");
        }
        
        // Fetch user's uploaded audio stories
        const { data: audioData, error: audioError } = await supabase
          .from("audio_stories")
          .select("*")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false });
        
        if (!audioError && audioData) {
          setUserAudioStories(audioData);
        }

        // Fetch user stats
        await fetchUserStats(user.id);
      }
      setLoading(false);
    };
    getUserAndProfile();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          getUserAndProfile();
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle profile name update
  const handleSave = async () => {
    if (!profile || saving || editName.trim() === "" || editName === profile.name) return;
    setSaving(true);
    const { error, data } = await supabase
      .from("profiles")
      .update({ name: editName, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select()
      .single();
    setSaving(false);
    if (!error) {
      setProfile(data);
      toast({ title: "Profile updated!" });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate("/auth");
  };

  // Delete audio story function
  const handleDeleteAudioStory = async (storyId: string) => {
    if (!user || deleting) return;
    
    setDeleting(storyId);
    try {
      const { error } = await supabase
        .from("audio_stories")
        .delete()
        .eq("id", storyId)
        .eq("uploaded_by", user.id); // Extra security check
      
      if (error) throw error;
      
      // Remove from local state
      setUserAudioStories(prev => prev.filter(story => story.id !== storyId));
      toast({ title: "Audio story deleted successfully!" });
    } catch (error: any) {
      toast({ 
        title: "Error deleting audio story", 
        description: error.message || "An error occurred", 
        variant: "destructive" 
      });
    } finally {
      setDeleting(null);
    }
  };

  // Avatar upload logic
  const onAvatarClick = () => {
    if (uploading) return; // Don't allow new upload while uploading
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset so user can reselect same file if needed
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file is .jpg (or .jpeg)
    if (!file.type.match(/^image\/jpeg$/)) {
      toast({ title: "Only .jpg images allowed", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filename = `${user.id}_${Date.now()}.jpg`;
    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filename, file, { upsert: true, contentType: "image/jpeg" });
      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error("Could not get public URL for uploaded image.");

      // Update profile.avatar_url
      const { error: updateError, data: updatedProfile } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProfile(updatedProfile);
      toast({ title: "Profile photo updated!" });
    } catch (err: any) {
      toast({ title: "Failed to upload photo", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <Avatar className="h-14 w-14 mb-2">
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div className="font-semibold text-base">No profile found</div>
        <Button className="mt-4" onClick={() => navigate("/auth")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      {/* Back button */}
      <div className="w-full flex mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/home")}
          aria-label="Back to home"
        >
          <ArrowLeft size={22} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Information Section */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="bg-card p-6 rounded-xl shadow-lg border border-primary/10 backdrop-blur-sm bg-opacity-95">
            <div className="flex flex-col items-center gap-6">
              {/* Avatar Section */}
              <div className="relative h-32 w-32">
                <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name || "User"} />
                  ) : (
                    <AvatarFallback className="text-4xl bg-muted">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  className="absolute right-0 bottom-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center w-10 h-10 border-2 border-background shadow-lg disabled:opacity-60 transition-all duration-200"
                  onClick={onAvatarClick}
                  aria-label={uploading ? "Uploading..." : "Upload new photo"}
                  disabled={uploading}
                  style={{ cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  {uploading
                    ? <Loader2 className="animate-spin" size={24} />
                    : <Plus size={24} />}
                </button>
                <input
                  type="file"
                  accept=".jpg,image/jpeg"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </div>
              
              {/* Name Edit Section */}
              <div className="flex flex-col w-full items-center gap-2">
                <div className="flex gap-2 w-full justify-center">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="max-w-[200px] py-2 text-lg flex-1 text-center font-medium"
                    placeholder="Your Name"
                    disabled={saving}
                  />
                  <Button
                    onClick={handleSave}
                    disabled={saving || editName.trim() === "" || editName === profile.name}
                    className="px-4"
                    variant="secondary"
                    type="button"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                  </Button>
                </div>
                <div className="text-muted-foreground text-sm">{user.email}</div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <StatsCard
                  icon={<Music className="w-5 h-5" />}
                  label="Uploads"
                  value={userStats.totalUploads}
                />
                <StatsCard
                  icon={<Calendar className="w-5 h-5" />}
                  label="Joined"
                  value={new Date(userStats.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                />
              </div>
              
              {/* Followers/Following Section */}
              <div className="w-full space-y-4">
                <FollowersList
                  userId={user.id}
                  currentUserId={user.id}
                  type="followers"
                  count={userStats.followers}
                />
                <FollowersList
                  userId={user.id}
                  currentUserId={user.id}
                  type="following"
                  count={userStats.following}
                />
              </div>
              
              {/* Sign Out Button */}
              <div className="w-full pt-4">
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2" size={18} />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Audio Stories Section */}
          <div className="bg-card p-6 rounded-xl shadow-lg border border-primary/10 backdrop-blur-sm bg-opacity-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Audio Stories</h2>
              <Button
                onClick={() => navigate("/upload")}
                size="sm"
                className="gap-2"
              >
                <Plus size={18} />
                Upload New
              </Button>
            </div>
            
            {userAudioStories.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-lg">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">You haven't uploaded any audio stories yet.</p>
                <p className="text-sm mt-2">Share your first story with the world!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {userAudioStories.map((story) => (
                  <div 
                    key={story.id} 
                    className="group flex flex-col bg-muted/30 rounded-lg border border-primary/10 overflow-hidden hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="aspect-video relative">
                      {story.cover_image_url ? (
                        <img
                          src={story.cover_image_url}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          No Cover Image
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAudioStory(story.id)}
                        disabled={deleting === story.id}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        {deleting === story.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium truncate" title={story.title}>
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="bg-primary/10 px-2 py-1 rounded">
                          {story.category || "Uncategorized"}
                        </span>
                        <span className="flex-1 text-right">
                          {new Date(story.created_at || "").toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
