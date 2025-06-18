
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function getInitials(name: string | null) {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

export default function UserDropdown() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ name: string | null; email: string | null } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile({ name: data?.name || "", email: user.email || "" });
      }
    };
    getUserAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setTimeout(() => getUserAndProfile(), 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user || !profile) return null;

  // When clicked, navigate to /profile
  return (
    <button
      type="button"
      aria-label="Your profile"
      className="rounded-full flex items-center justify-center w-10 h-10 bg-muted hover:bg-accent transition"
      style={{
        boxShadow: "0 0 14px 3px #2295ff88, 0 2px 8px #0002",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => navigate("/profile")}
    >
      <Avatar className="h-9 w-9">
        <AvatarFallback>
          <UserIcon size={20} className="text-primary" />
        </AvatarFallback>
      </Avatar>
    </button>
  );
}
