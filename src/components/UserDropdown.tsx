import { User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, LogOut, MessageCircle, Users, Music } from "lucide-react";

interface UserProfile {
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

export default function UserDropdown() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    
       
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative group">
          <span className="absolute inset-0 z-0 rounded-full pointer-events-none group-hover:blur-sm group-hover:opacity-80 transition-all duration-300" style={{boxShadow: '0 0 16px 4px #3b82f6, 0 0 32px 8px #60a5fa'}}></span>
          <Avatar className="h-8 w-8 relative z-10 ring-2 ring-blue-400 ring-offset-2 ring-offset-black shadow-lg">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.name || "User"} />
            ) : (
              <AvatarFallback className="text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile.name || "Anonymous User"}</p>
          <p className="text-xs text-muted-foreground truncate">Welcome back!</p>
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/friends")}>
          <Users className="mr-2 h-4 w-4" />
          Friends
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/chat")}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/playlists")}>
          <Music className="mr-2 h-4 w-4" />
          Playlists
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  
  );
}
