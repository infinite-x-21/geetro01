import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Plus } from "lucide-react";
import UserDropdown from "@/components/UserDropdown";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="w-full fixed left-0 top-0 z-50 flex justify-between items-center px-8 py-4" style={{overflow: 'visible', minHeight: 64, background: 'none', boxShadow: 'none', border: 'none'}}>
      {/* Decorative SVG left */}
      <div className="hidden md:block pointer-events-none select-none absolute left-0 top-0 z-40 h-full w-32 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#blurNav1)">
            <circle cx="30" cy="20" r="12" fill="#FFB13C" fillOpacity="0.18" />
            <text x="10" y="45" fontSize="24" fill="#FFB13C" fillOpacity="0.18" fontFamily="Segoe UI, sans-serif">🎵</text>
          </g>
          <defs>
            <filter id="blurNav1" x="-10" y="0" width="140" height="80" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
        </svg>
      </div>
      {/* Decorative SVG right */}
      <div className="hidden md:block pointer-events-none select-none absolute right-0 top-0 z-40 h-full w-32 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#blurNav2)">
            <rect x="80" y="20" width="20" height="20" rx="5" fill="#FFB13C" fillOpacity="0.13" />
            <text x="70" y="45" fontSize="22" fill="#FFB13C" fillOpacity="0.15" fontFamily="Segoe UI, sans-serif">🎙️</text>
            <text x="40" y="30" fontSize="20" fill="#FFB13C" fillOpacity="0.13" fontFamily="Segoe UI, sans-serif">📖</text>
          </g>
          <defs>
            <filter id="blurNav2" x="40" y="0" width="80" height="80" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
        </svg>
      </div>
      <div className="flex items-center gap-6">
         {/* User icon next to logo and home */}
         {user && (
          <div className="ml-2">
            <div className="rounded-full bg-black/30 shadow-xl drop-shadow-lg hover:scale-110 transition-transform">
              <UserDropdown />
            </div>
          </div>
        )}
        {/* Plus icon as first nav item */}
        <Button asChild variant="ghost" size="icon" className="hover:scale-110 transition-transform bg-amber-500/20 text-amber-400 shadow-xl rounded-full border border-amber-400/40 drop-shadow-lg">
          <Link to="/stories">
            <Plus size={28} />
          </Link>
        </Button>
        {/* Home Icon */}
        <Button asChild variant="ghost" size="icon" className="hover:scale-110 transition-transform bg-amber-500/20  text-primary rounded-full drop-shadow-lg">
          <Link to="/home">
            <Home size={28} className="text-primary" />
          </Link>
        </Button>
       
      </div>
      <div className="flex gap-4 items-center">
        {user ? (
          <Button
            variant="outline"
            size="icon"
            aria-label="Logout"
            onClick={handleLogout}
            className="hover:bg-destructive/80 hover:text-destructive shadow-xl bg-black/30 rounded-full drop-shadow-lg hover:scale-110 transition-transform"
          >
            <LogOut size={20} />
          </Button>
        ) : (
          <Button
            asChild
            variant="default"
            className="font-neon shadow-xl bg-black/30 rounded-full drop-shadow-lg hover:scale-110 transition-transform"
          >
            <Link to="/auth">Login</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
