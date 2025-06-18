
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { User as UserIcon } from "lucide-react";

// Util to get initials
function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ id: string; name: string | null; avatar_url: string | null } | null>(null);
  const navigate = useNavigate();

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
        }
      }
    };
    getUserAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => getUserAndProfile(), 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // Now the avatar button navigates to /profile instead of showing dropdown
  return (
    <button
      className="rounded-full p-0 m-0 border-0 bg-transparent outline-none hover:opacity-90 transition"
      onClick={() => navigate("/profile")}
      aria-label="View profile"
      style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
    >
      <Avatar>
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={profile.name || "User"} />
        ) : (
          <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
        )}
      </Avatar>
    </button>
  );
}
