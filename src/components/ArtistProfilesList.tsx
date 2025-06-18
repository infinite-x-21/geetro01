import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  followers_count?: number;
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
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchArtists() {
      console.log("Fetching artists...");
      setLoading(true);
      
      // Get all unique uploaders from audio_stories
      const { data: stories, error: storyErr } = await supabase
        .from("audio_stories")
        .select("uploaded_by")
        .not("uploaded_by", "is", null);

      if (storyErr || !stories) {
        console.error("Error fetching stories:", storyErr);
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds: string[] = Array.from(new Set(stories.map(x => x.uploaded_by).filter(Boolean)));

      if (userIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these users
      const { data: artistProfiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      if (profileErr) {
        console.error("Error fetching profiles:", profileErr);
        setProfiles([]);
        setLoading(false);
        return;
      }

      if (artistProfiles) {
        // Fetch follower counts for each artist
        const profilesWithStats = await Promise.all(
          artistProfiles.map(async (profile) => {
            const { data: stats } = await supabase.rpc('get_user_stats', { user_id: profile.id });
            return {
              ...profile,
              followers_count: stats?.[0]?.followers_count ?? 0
            };
          })
        );

        // Sort profiles by name or ID
        const sortedProfiles = [...profilesWithStats].sort((a, b) =>
          (a.name || a.id).localeCompare(b.name || b.id)
        );
        
        setProfiles(sortedProfiles);
      } else {
        setProfiles([]);
      }

      setLoading(false);
    }
    
    fetchArtists();
  }, []);

  // Handle profile click to view artist's profile
  const handleProfileClick = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // Prevent triggering the parent button's onClick
    navigate(`/profile/${profileId}`);
  };

  if (loading) {
    return (
      <div className="flex w-full justify-center items-center py-10 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-2"></div>
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
        className={`flex flex-col items-center min-w-[100px] px-3 py-3 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:scale-105
          ${selectedArtistId === null 
            ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
            : 'border-transparent hover:bg-muted/70 hover:border-muted'
          }
        `}
        aria-label="Show all artists"
      >
        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-lg font-bold">
            <UserIcon size={24} className="text-primary" />
          </AvatarFallback>
        </Avatar>
        <span className="mt-2 text-sm font-semibold text-center">All</span>
      </button>

      {/* Artist profiles */}
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={`flex flex-col items-center min-w-[100px] px-3 py-3 rounded-xl border-2 transition-all duration-200 group
            ${selectedArtistId === profile.id 
              ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30' 
              : 'border-transparent hover:bg-muted/70 hover:border-muted'
            }
          `}
        >
          {/* Artist Selection Button */}
          <button
            onClick={() => onSelectArtist(profile.id)}
            className="flex flex-col items-center w-full cursor-pointer"
            aria-label={profile.name || 'Artist profile'}
          >
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
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
            <div className="mt-2 w-full text-center space-y-1">
              {profile.name ? (
                <span className="font-medium text-sm truncate block">
                  {profile.name}
                </span>
              ) : (
                <span className="opacity-60 italic flex items-center justify-center gap-1 text-xs">
                  <UserIcon size={12} /> Unknown
                </span>
              )}
              {/* Followers count */}
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Users size={12} />
                <span>{profile.followers_count}</span>
              </div>
            </div>
          </button>

          {/* View Profile Button */}
          <button
            onClick={(e) => handleProfileClick(e, profile.id)}
            className="mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors duration-200 text-primary opacity-0 group-hover:opacity-100"
          >
            View Profile
          </button>
        </div>
      ))}
    </div>
  );
}
