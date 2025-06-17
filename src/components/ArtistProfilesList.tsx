
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

interface ArtistProfilesListProps {
  selectedArtistId: string | null;
  onSelectArtist: (artistId: string | null) => void;
}

export default function ArtistProfilesList({ selectedArtistId, onSelectArtist }: ArtistProfilesListProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtists() {
      console.log("Fetching artists...");
      setLoading(true);
      
      // Get all unique uploaders from audio_stories
      const { data: stories, error: storyErr } = await supabase
        .from("audio_stories")
        .select("uploaded_by")
        .not("uploaded_by", "is", null);

      console.log("Stories data:", stories);
      console.log("Stories error:", storyErr);

      if (storyErr || !stories) {
        console.error("Error fetching stories:", storyErr);
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds: string[] = Array.from(new Set(stories.map(x => x.uploaded_by).filter(Boolean)));
      console.log("Unique user IDs:", userIds);

      if (userIds.length === 0) {
        console.log("No user IDs found");
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these users
      const { data: artistProfiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      console.log("Artist profiles data:", artistProfiles);
      console.log("Artist profiles error:", profileErr);

      if (profileErr) {
        console.error("Error fetching profiles:", profileErr);
        setProfiles([]);
      } else if (artistProfiles) {
        // Sort profiles by name or ID
        const sortedProfiles = [...artistProfiles].sort((a, b) =>
          (a.name || a.id).localeCompare(b.name || b.id)
        );
        console.log("Sorted profiles:", sortedProfiles);
        setProfiles(sortedProfiles);
      } else {
        setProfiles([]);
      }

      setLoading(false);
    }
    
    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center py-10 text-muted-foreground">
        Loading artists...
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="flex w-full justify-center items-center py-10 text-muted-foreground">
        No artists found yet.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      <style>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Show an "All" option to clear selection */}
      <button
        onClick={() => onSelectArtist(null)}
        className={`flex flex-col items-center min-w-[80px] px-2 py-3 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:scale-105
          ${selectedArtistId === null 
            ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
            : 'border-transparent hover:bg-muted/70 hover:border-muted'
          }
        `}
        aria-label="Show all artists"
      >
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-lg font-bold">
            <UserIcon size={20} className="text-primary" />
          </AvatarFallback>
        </Avatar>
        <span className="mt-2 text-xs font-semibold text-center">All</span>
      </button>

      {/* Artist profiles */}
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => onSelectArtist(profile.id)}
          className={`flex flex-col items-center min-w-[80px] px-2 py-3 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:scale-105
            ${selectedArtistId === profile.id 
              ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
              : 'border-transparent hover:bg-muted/70 hover:border-muted'
            }
          `}
          aria-label={profile.name || 'Artist profile'}
        >
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            {profile.avatar_url ? (
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile.name || "Artist"} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-muted to-muted/70">
                {getInitials(profile.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="mt-2 w-full text-xs text-center">
            {profile.name ? (
              <span className="font-medium truncate block max-w-[70px]">
                {profile.name}
              </span>
            ) : (
              <span className="opacity-60 italic flex items-center justify-center gap-1 text-[10px]">
                <UserIcon size={10} /> Unknown
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
