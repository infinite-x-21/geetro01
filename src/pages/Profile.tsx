import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User as UserIcon, Loader2, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AudioStoryRow = Database["public"]["Tables"]["audio_stories"]["Row"];

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // eslint-disable-next-line
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
    <div className="max-w-4xl mx-auto mt-8 p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information Section */}
        <div className="bg-card p-6 rounded-xl shadow border border-primary/10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="relative h-20 w-20 mb-1">
                <Avatar className="h-20 w-20 ring-2 ring-primary">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name || "User"} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-muted">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  className="absolute right-0 bottom-0 bg-primary text-primary-foreground rounded-full flex items-center justify-center w-8 h-8 border-2 border-background shadow-lg disabled:opacity-60"
                  onClick={onAvatarClick}
                  aria-label={uploading ? "Uploading..." : "Upload new photo"}
                  disabled={uploading}
                  style={{ cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  {uploading
                    ? <Loader2 className="animate-spin" size={20} />
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
            </div>
            
            <div className="flex flex-col w-full items-center gap-2 text-center">
              <label className="text-sm font-bold mb-0.5 w-full text-center">Name:</label>
              <div className="flex gap-2 w-full justify-center">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="max-w-[160px] py-1.5 text-base flex-1 text-center"
                  placeholder="Your Name"
                  disabled={saving}
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || editName.trim() === "" || editName === profile.name}
                  className="px-2"
                  variant="secondary"
                  type="button"
                  style={{ minWidth: "2.8rem" }}
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col w-full items-center gap-1 mt-2">
              <label className="text-sm font-bold">Email:</label>
              <div className="w-full text-center text-base text-muted-foreground truncate">{user.email}</div>
            </div>
            
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

        {/* User's Audio Stories Section */}
        <div className="bg-card p-6 rounded-xl shadow border border-primary/10">
          <h2 className="text-xl font-bold mb-4 text-center">My Audio Stories</h2>
          
          {userAudioStories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>You haven't uploaded any audio stories yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userAudioStories.map((story) => (
                <div key={story.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {story.cover_image_url ? (
                        <img
                          src={story.cover_image_url}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate" title={story.title}>
                        {story.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {story.category || "Uncategorized"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(story.created_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAudioStory(story.id)}
                    disabled={deleting === story.id}
                    className="ml-2 px-2"
                  >
                    {deleting === story.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
