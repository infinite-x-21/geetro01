import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-card shadow-xl p-8 rounded-lg flex flex-col gap-4 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">{mode === "login" ? "Welcome back" : "Create an account"}</h1>
        <Input
          placeholder="Email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          placeholder="Your Name"
          type="text"
          value={name}
          autoComplete="name"
          onChange={e => setName(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : (mode === "login" ? "Login" : "Sign up")}
        </Button>
        <div className="flex flex-row gap-1 text-sm text-muted-foreground justify-center">
          {mode === "login" ? (
            <>
              Don't have an account?
              <button className="underline" type="button" onClick={() => setMode("signup")}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?
              <button className="underline" type="button" onClick={() => setMode("login")}>Log in</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
