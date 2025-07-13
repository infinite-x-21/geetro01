
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onUpload?: () => void;
}

const CATEGORIES = [
  { id: "videos", label: "Videos" },
  { id: "entertainment", label: "Entertainment" },
  { id: "educational", label: "Educational" },
  { id: "music", label: "Music Videos" },
];

// Helper to upload wallpaper image to Supabase Storage
async function uploadWallpaperImage(userId: string, file: File): Promise<string | null> {
  if (!file) return null;
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/wallpapers/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("video-wallpapers")
    .upload(filePath, file);
  if (error) throw new Error(error.message);
  
  const { data: publicUrl } = supabase.storage
    .from("video-wallpapers")
    .getPublicUrl(filePath);
  
  return publicUrl.publicUrl;}

// Helper to upload video file to Supabase Storage
async function uploadVideoFile(userId: string, file: File): Promise<string | null> {
  if (!file) return null;
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/videos/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("story-videos")
    .upload(filePath, file);
  if (error) throw new Error(error.message);
  
  const { data: publicUrl } = supabase.storage
    .from("story-videos")
    .getPublicUrl(filePath);
  
  return publicUrl.publicUrl;}

export default function VideoStoryUpload({ onUpload }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("videos");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setWallpaperFile(e.target.files[0]);
      setWallpaperPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!videoFile && !youtubeUrl.trim())) {
      toast({ 
        title: "Missing info", 
        description: "Please add a title and either select a video file or provide a YouTube URL.", 
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast({title:"Not authenticated", description:"Please sign in!", variant: "destructive"});
      setUploading(false);
      return;
    }

    try {
      // Upload wallpaper image if present
      let wallpaperUrl: string | null = null;
      if (wallpaperFile) {
        wallpaperUrl = await uploadWallpaperImage(user.id, wallpaperFile);
      }

      // Upload video file if present, otherwise use YouTube URL
      let videoUrl: string | null = null;
      if (videoFile) {
        videoUrl = await uploadVideoFile(user.id, videoFile);
      } else if (youtubeUrl.trim()) {
        videoUrl = youtubeUrl.trim();
      }

      // Save to DB
      const { error: dbErr } = await supabase.from("video_stories").insert([
        {
          title,
          category,
          video_url: videoUrl,
          wallpaper_url: wallpaperUrl,
          youtube_url: youtubeUrl.trim() || null,
          uploaded_by: user.id,
        }
      ]);

      if (dbErr) {
        toast({title: "Failed to save video story", description: dbErr.message, variant: "destructive"});
      } else {
        toast({title:"Video story uploaded!"});
        setTitle("");
        setVideoFile(null);
        setWallpaperFile(null);
        setYoutubeUrl("");
        setWallpaperPreview(null);
        setCategory("videos");
        if (onUpload) onUpload();
      }
    } catch (err: any) {
      toast({title: "Upload failed", description: err?.message, variant: "destructive"});
    }
    
    setUploading(false);
  };

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-5 bg-card shadow-xl rounded-2xl p-7 w-full max-w-md mx-auto mb-2 animate-fade-in">
      <h2 className="text-xl font-bold text-primary mb-2">Upload Video</h2>
      
      <Input 
        placeholder="Video title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={uploading}
      />

      <div className="flex justify-between items-center gap-3">
        <label className="font-semibold text-sm">Select category:</label>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              disabled={uploading}
              type="button"
              className={`px-4 py-1 rounded-full font-semibold text-xs transition 
                ${category === cat.id
                  ? "bg-primary text-white shadow" 
                  : "bg-muted text-muted-foreground hover:bg-background/60"}`
              }
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wallpaper Upload & Preview */}
      <div>
        <label className="block font-semibold text-sm mb-1">Optional wallpaper image:</label>
        <Input 
          type="file"
          accept="image/*"
          onChange={handleWallpaperChange}
          disabled={uploading}
        />
        {wallpaperPreview && (
          <div className="mt-2 w-full flex justify-center">
            <img
              src={wallpaperPreview}
              alt="Wallpaper preview"
              className="max-h-32 rounded-lg border shadow-md object-cover"
              style={{ maxWidth: "220px" }}
            />
          </div>
        )}
      </div>

      {/* Video File Upload */}
      <div>
        <label className="block font-semibold text-sm mb-1">Upload video file:</label>
        <Input 
          type="file"
          accept="video/*"
          onChange={handleVideoFileChange}
          disabled={uploading}
        />
      </div>

      {/* YouTube URL */}
      <div>
        <label className="block font-semibold text-sm mb-1">Or YouTube URL:</label>
        <Input 
          placeholder="https://youtube.com/watch?v=..."
          type="url"
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          disabled={uploading}
        />
      </div>

      <Button type="submit" disabled={uploading} className="btn-primary rounded-xl font-neon uppercase tracking-widest h-11 mt-2">
        {uploading ? "Uploading..." : "Upload Video"}
      </Button>
    </form>
  );
}
