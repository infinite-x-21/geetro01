import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Music } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Store user state, respond to auth state changes.
  useEffect(() => {
    let ignore = false;

    // Listen for auth state changes reliably
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;
      if (session?.user) {
        navigate("/home");
      }
    });

    // On initial mount, check session as backup
    supabase.auth.getUser().then(({ data }) => {
      if (!ignore && data.user) {
        navigate("/home");
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      // Add 'name' to user_metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name }
        }
      });
      if (!error) {
        toast({ title: "Check your email!", description: "A confirmation link was sent." });
      } else {
        toast({ title: "Sign up error", description: error.message, variant: "destructive" });
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        // After login, update user_metadata name if needed
        // Only if the name has changed or isn't set
        if (data.user) {
          const currentName = data.user.user_metadata?.name || "";
          if (name && name !== currentName) {
            await supabase.auth.updateUser({ data: { name } });
          }
        }
        toast({ title: "Signed in!" });
        navigate("/home");
      } else {
        toast({ title: "Login error", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-background/90 animate-fade-in relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#FFB13C,transparent_70%)] opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#FFB13C,transparent_50%)] opacity-10"></div>
      </div>
      
      {/* Logo and decorative music note */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center mb-2">
          <Music className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-amber-400">GeetroX</h1>
      </div>

      <div className="relative z-10">
        <form onSubmit={handleSubmit} className="backdrop-blur-sm bg-black/40 shadow-2xl p-8 rounded-xl flex flex-col gap-4 w-full max-w-md border border-amber-500/10">
          <h1 className="text-2xl font-bold mb-2 text-amber-100">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          
          <Input
            placeholder="Email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            className="bg-black/50 border-amber-500/30 focus:border-amber-500/50"
          />
          
          {/* Only show name field during signup */}
          {mode === "signup" && (
            <Input
              placeholder="Your Name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={e => setName(e.target.value)}
              required={mode === "signup"}
              disabled={loading}
              className="bg-black/50 border-amber-500/30 focus:border-amber-500/50"
            />
          )}
          
          <Input
            placeholder="Password"
            type="password"
            value={password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="bg-black/50 border-amber-500/30 focus:border-amber-500/50"
          />

          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>

      {/* Decorative circles */}
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2"></div>
    </div>
  );
}
