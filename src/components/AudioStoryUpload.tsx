import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Music, UploadCloud, CheckCircle2 } from "lucide-react";

interface Props {
  onUpload?: () => void;
}

const CATEGORIES = [
  { id: "music", label: "Music" },
  { id: "podcast", label: "Podcast" },
  { id: "stories", label: "Stories" },
];

// Helper to upload cover image to Supabase Storage
async function uploadCoverImage(userId: string, file: File): Promise<string | null> {
  if (!file) return null;
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/covers/${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("audio-story-covers")
    .upload(filePath, file);
  if (error) throw new Error(error.message);
  // Return public URL
  return `https://pxnwcbxhqwsuoqmvcsph.supabase.co/storage/v1/object/public/audio-story-covers/${filePath}`;
}

export default function AudioStoryUpload({ onUpload }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("music");
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
      setImageUrlPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      toast({ title: "Missing info", description: "Please add a title and select a file.", variant: "destructive"});
      return;
    }
    setUploading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast({title:"Not authenticated", description:"Please sign in!", variant: "destructive"});
      setUploading(false);
      return;
    }
    // Upload cover image if present
    let coverImageUrl: string | null = null;
    if (imageFile) {
      try {
        coverImageUrl = await uploadCoverImage(user.id, imageFile);
      } catch (err: any) {
        toast({title: "Image upload failed", description: err?.message, variant: "destructive"});
        setUploading(false);
        return;
      }
    }
    // Upload audio
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: storageData, error: storageErr } = await supabase
      .storage
      .from("story-audio")
      .upload(filePath, file);
    if (storageErr) {
      toast({title: "Upload failed", description: storageErr.message, variant: "destructive"});
      setUploading(false);
      return;
    }
    // Save to DB with (optionally) cover_image_url
    const { error: dbErr } = await supabase.from("audio_stories").insert([
      {
        title,
        category,
        audio_url: `https://pxnwcbxhqwsuoqmvcsph.supabase.co/storage/v1/object/public/story-audio/${filePath}`,
        uploaded_by: user.id,
        cover_image_url: coverImageUrl,
      }
    ]);
    if (dbErr) {
      toast({title: "Failed to save story", description: dbErr.message, variant: "destructive"});
    } else {
      toast({title:"Story uploaded!"});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setTitle("");
      setFile(null);
      setCategory("music");
      setImageFile(null);
      setImageUrlPreview(null);
      if (onUpload) onUpload();
    }
    setUploading(false);
  };

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-2xl rounded-3xl p-8 w-full max-w-lg mx-auto mb-2 animate-fade-in relative">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${step === 1 ? 'bg-amber-500' : 'bg-muted'}`}>1</span>
        <span className="text-amber-200 font-semibold">Details</span>
        <span className="w-8 h-0.5 bg-amber-400 mx-2 rounded-full" />
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${step === 2 ? 'bg-amber-500' : 'bg-muted'}`}>2</span>
        <span className="text-amber-200 font-semibold">Upload</span>
      </div>
      {/* Large icon */}
      <div className="flex justify-center mb-2">
        <Music className="w-14 h-14 text-amber-400 drop-shadow-lg" />
      </div>
      <h2 className="text-2xl font-bold text-amber-200 mb-2 text-center">Upload Audio</h2>
      {/* Drag and drop area for image */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <label className="font-semibold text-sm mb-1">Optional cover image:</label>
        <div className="w-full flex justify-center">
          <label className="w-40 h-32 flex flex-col items-center justify-center border-2 border-dashed border-amber-400 rounded-xl cursor-pointer bg-black/30 hover:bg-amber-500/10 transition">
            {imageUrlPreview ? (
              <img src={imageUrlPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <UploadCloud className="w-8 h-8 text-amber-400 mb-1" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
            <span className="text-xs text-amber-200 mt-1">Drag or click to upload</span>
          </label>
        </div>
      </div>
      <Input 
        placeholder="Story title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={uploading}
        className="bg-black/40 text-amber-100 border-amber-400"
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
                  ? "bg-amber-500 text-white shadow" 
                  : "bg-muted text-muted-foreground hover:bg-background/60"}`
              }
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      {/* Drag and drop area for audio */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <label className="font-semibold text-sm mb-1">Audio file:</label>
        <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-amber-400 rounded-xl cursor-pointer bg-black/30 hover:bg-amber-500/10 transition py-6">
          <UploadCloud className="w-8 h-8 text-amber-400 mb-1" />
          <input type="file" accept="audio/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          <span className="text-xs text-amber-200 mt-1">Drag or click to upload audio</span>
          {file && <span className="text-xs text-amber-300 mt-1">{file.name}</span>}
        </label>
      </div>
      {/* Progress bar */}
      {uploading && (
        <div className="w-full h-2 bg-amber-100/20 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-amber-500 animate-pulse" style={{ width: '80%' }} />
        </div>
      )}
      <button type="submit" disabled={uploading} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-lg transition mt-2 flex items-center justify-center gap-2">
        {uploading ? <UploadCloud className="animate-spin" /> : <UploadCloud />} {uploading ? "Uploading..." : "Upload"}
      </button>
      {/* Success animation */}
      {success && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-3xl animate-fade-in z-10">
          <CheckCircle2 className="w-20 h-20 text-green-400 mb-4 animate-bounce" />
          <div className="text-2xl font-bold text-green-300">Uploaded!</div>
        </div>
      )}
    </form>
  );
}

