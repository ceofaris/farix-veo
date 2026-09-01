import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FarixMark } from "@/components/farix-logo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => {
    const title = "Sign In | Farix AI";
    const description =
      "Sign in to your Farix AI account to access your assigned premium AI tools. Access is invite-only and provided by an authorized Farix AI reseller.";
    const image = "https://farixai.lovable.app/__l5e/assets-v1/5f13d1dc-09a1-42c1-855d-4edb89b406e9/farix-mark.png";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://farixai.com/auth" },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: "https://farixai.com/auth" }],
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function landingRouteFor(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    const profile = data as { role?: string; is_active?: boolean } | null;
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      qc.setQueryData(["current-profile"], null);
      return null;
    }
    // Prime the shared profile cache so protected layouts render immediately
    // instead of waiting on their own fetch (which caused the stuck "Loading…").
    qc.setQueryData(["current-profile"], profile ?? null);
    const role = profile?.role;
    if (role === "king") return "/king" as const;
    if (role === "reseller") return "/reseller" as const;
    return "/dashboard" as const;
  }

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) return;
        const to = await landingRouteFor(user.id);
        if (to && !cancelled) navigate({ to, replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return toast.error(error.message);
      }
      const to = await landingRouteFor(data.user!.id);
      if (!to) {
        return toast.error("Your account has been disabled. Contact the administrator.");
      }
      toast.success("Signed in");
      navigate({ to, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <FarixMark className="h-7" />
          <span className="text-xl font-semibold tracking-tight text-foreground">Farix</span>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h1 className="text-2xl font-semibold text-center">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Enter your credentials to continue.
          </p>
          <form onSubmit={handleSignIn} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background border-border pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : "Sign In"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-6">
            No public signup. Contact your admin or reseller to get an account.
          </p>
        </div>
      </div>
    </div>
  );
}
