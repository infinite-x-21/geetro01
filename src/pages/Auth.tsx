import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Music } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { WelcomeAstronautModal } from "@/components/WelcomeAstronautModal";

// Floating, interactive icons (music left side, others as before)
function FloatingIcons() {
  // Icon SVGs
  const musicIcon = (
    <svg viewBox="0 0 24 24" className="w-12 h-12 md:w-16 md:h-16 fill-amber-400 drop-shadow-xl">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
  const micIcon = (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 fill-orange-400 drop-shadow-xl">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 0 1 2 0 7 7 0 0 1-6 6.92V21h-2v-3.08A7 7 0 0 1 5 11a1 1 0 0 1 2 0 5 5 0 0 0 10 0z"/>
    </svg>
  );
  const storyIcon = (
    <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 fill-pink-400 drop-shadow-xl">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 18V14a3 3 0 0 1 6 0v4"/>
    </svg>
  );
  // Only music icon on left, others as subtle floating
  return (
    <>
      <div className="pointer-events-none select-none absolute left-6 top-1/2 -translate-y-1/2 z-10">
        {musicIcon}
      </div>
      <div className="pointer-events-none select-none absolute right-12 top-24 animate-float-up-2 z-10">{micIcon}</div>
      <div className="pointer-events-none select-none absolute right-8 bottom-24 animate-float-up-3 z-10">{storyIcon}</div>
    </>
  );
}

// Astronaut speech bubble
function AstronautSpeech({ visible }: { visible: boolean }) {
  return (
    <div className="absolute bottom-24 right-8 z-40">
      <div className="bg-white/90 text-zinc-800 text-xs px-3 py-1 rounded-full shadow border border-amber-200 animate-fade-in font-semibold">
        {visible ? "jaldise password dekh leta hu" : "arrey yar !"}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupVisitCount, setSignupVisitCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for authenticated user
  useEffect(() => {
    if (showWelcome) return; // Don't auto-redirect while welcome modal is open
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate("/home");
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !showWelcome) {
        navigate("/home");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, showWelcome]);

  // Track sign up page visits
  useEffect(() => {
    if (mode === "signup") {
      setSignupVisitCount((count) => count + 1);
    }
    // eslint-disable-next-line
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name }
          }
        });

        if (error) throw error;
        
        toast({ 
          title: "Check your email!", 
          description: "A confirmation link was sent to your email address." 
        });
        // After successful signup, redirect with welcome hash
        window.location.href = "/home#welcome";
        return;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) throw error;

        // After login, update user metadata if needed
        if (data.user) {
          const currentName = data.user.user_metadata?.name;
          if (name && currentName !== name) {
            await supabase.auth.updateUser({
              data: { name }
            });
          }
        }

        setShowWelcome(true); // Show astronaut welcome modal
        setTimeout(() => {
          setShowWelcome(false);
          window.location.href = "/home#welcome";
        }, 2500);
        return;
      }
    } catch (error: any) {
      toast({ 
        title: mode === "signup" ? "Sign up failed" : "Login failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }
  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    });
    
    if (error) {
      toast({ title: "Google sign-in error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden">
      <FloatingIcons />
      <div className="w-full max-w-md mx-4 relative z-20">
        <div className="bg-card/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-amber-500/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-amber-400">
              {mode === "login" ? "Welcome Back!" : "Join GeetroX"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "login" 
                ? "Sign in to continue your musical journey"
                : "Create an account to start your musical journey"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === "signup" && (
              <div className="space-y-2">
                
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-background/50 pr-12"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500 transition p-1 bg-white/70 rounded-full shadow"
                tabIndex={0}
                onClick={() => setShowPassword(v => !v)}
                style={{lineHeight:0}}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white text-zinc-800 border border-zinc-200 shadow hover:bg-zinc-50 font-semibold"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.13 2.7 30.45 0 24 0 14.82 0 6.73 5.8 2.69 14.09l7.98 6.2C12.13 13.13 17.57 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.2 5.6C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29c-1.13-3.36-1.13-6.97 0-10.33l-7.98-6.2C.7 15.27 0 19.51 0 24s.7 8.73 2.69 12.24l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.45 0 12.13-2.13 16.19-5.81l-7.2-5.6c-2.01 1.35-4.59 2.16-8.99 2.16-6.43 0-11.87-3.63-14.33-8.79l-7.98 6.2C6.73 42.2 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-amber-400 hover:text-amber-500"
            >
              {mode === "login" 
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
      {/* Astronaut speech bubble absolutely positioned above astronaut, not grouped */}
      <div className="absolute bottom-32 right-36 z-40 pointer-events-none">
        <div className="bg-white/90 text-zinc-800 text-xs px-3 py-1 rounded-full shadow border border-amber-200 animate-fade-in font-semibold">
          {mode === "signup"
            ? signupVisitCount > 2
              ? "Jaldi Accout Create Karo Na"
              : signupVisitCount > 1
                ? "Bar Bar Nahi Bolunga, Account Create Karo Chalo"
                : "Hehe!, Register karnese pehle sign in kar rahe the"
            : showPassword
              ? "jaldise password dekh leta hu"
              : "arrey yar !"}
        </div>
      </div>
      {/* Astronaut alone */}
      <div className="absolute bottom-0 right-32 z-30 pointer-events-none">
        <div className="w-20 h-20 animate-astronaut-swing">
          <svg viewBox="0 0 64 64" className="w-full h-full">
            {/* Helmet */}
            <circle cx="32" cy="24" r="16" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
            {/* Visor */}
            <ellipse cx="32" cy="24" rx="10" ry="8" fill="#b3d0f7" opacity="0.7" />
            {/* Body */}
            <rect x="24" y="36" width="16" height="18" rx="6" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
            {/* Left Arm (down) */}
            <rect x="8" y="44" width="14" height="6" rx="3" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" transform="rotate(10 15 47)" />
            {/* Right Arm (down) */}
            <rect x="44" y="46" width="8" height="12" rx="4" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
            {/* Legs */}
            <rect x="26" y="54" width="4" height="8" rx="2" fill="#bfc9d9" />
            <rect x="34" y="54" width="4" height="8" rx="2" fill="#bfc9d9" />
          </svg>
        </div>
      </div>
      <WelcomeAstronautModal open={showWelcome} onOpenChange={setShowWelcome} />
    </div>
  );
}
