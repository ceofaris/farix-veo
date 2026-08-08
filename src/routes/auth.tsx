import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapKing } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Farix" },
      { name: "description", content: "Sign in to the Farix cookie management platform." },
      { property: "og:title", content: "Sign in — Farix" },
      { property: "og:description", content: "Sign in to the Farix cookie management platform." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "bootstrap">("signin");
  const bootstrap = useServerFn(bootstrapKing);

  async function landingRouteFor(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", userId)
      .maybeSingle();
    const profile = data as { role?: string; is_active?: boolean } | null;
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return null;
    }
    const role = profile?.role;
    if (role === "king") return "/king" as const;
    if (role === "reseller") return "/reseller" as const;
    return "/dashboard" as const;
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const to = await landingRouteFor(user.id);
      if (to) navigate({ to, replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    const to = await landingRouteFor(data.user!.id);
    if (!to) {
      setLoading(false);
      return toast.error("Your account has been disabled. Contact the administrator.");
    }

    setLoading(false);
    toast.success("Signed in");
    navigate({ to, replace: true });
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await bootstrap({ data: { email, password, full_name: fullName } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Admin account created");
      navigate({ to: "/king", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Shield className="w-6 h-6" />
          <span className="text-xl font-semibold tracking-tight">Farix</span>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h1 className="text-2xl font-semibold text-center">
            {mode === "signin" ? "Sign in to your account" : "Create first admin"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {mode === "signin"
              ? "Enter your credentials to continue."
              : "This is only available before any admin exists."}
          </p>
          <form
            onSubmit={mode === "signin" ? handleSignIn : handleBootstrap}
            className="mt-6 space-y-4"
          >
            {mode === "bootstrap" && (
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-background border-border"
                />
              </div>
            )}
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
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Admin"}
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
