import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Fingerprint, Mail } from "lucide-react";
import { AuthLayout } from "@/components/breakout/auth-layout";
import { CheckBox, Field, OrDivider, PasswordField, SecureNote, SsoButton } from "@/components/breakout/form-fields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Breakout" },
      { name: "description", content: "Secure operator access to your Breakout incident response workspace." },
      { property: "og:title", content: "Log in — Breakout" },
      { property: "og:description", content: "Secure operator access to your Breakout incident response workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/command-center" });
  };

  return (
    <AuthLayout
      headline={
        <>
          Back on watch.
          <br />
          Ready for what’s next.
        </>
      }
      topRight={
        <>
          New to Breakout?{" "}
          <Link to="/" className="ml-1 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            Create an account <ArrowUpRight className="size-4" />
          </Link>
        </>
      }
    >
      <p className="eyebrow flex items-center gap-2 text-muted-foreground">
        <Fingerprint className="size-4 text-primary" />
        Secure operator access
      </p>
      <h2 className="mt-3 text-4xl font-normal tracking-tight text-foreground">Welcome back.</h2>
      <p className="mt-3 text-muted-foreground">Log in to your workspace and take the next action.</p>

      <form onSubmit={onSubmit} className="mt-7">
        <SsoButton />
        <OrDivider />
        <div className="space-y-5">
          <Field label="Work email" name="email" type="email" placeholder="alex@acme.com" autoComplete="email" icon={<Mail />} required />
          <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="••••••••••••••" required />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <CheckBox checked={remember} onChange={setRemember}>
            Remember this device
          </CheckBox>
          <button type="button" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-md border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="signal" size="xl" className="mt-6 w-full" disabled={busy}>
          <ArrowRight />
          {busy ? "Logging in…" : "Log in to Breakout"}
        </Button>
      </form>
      <SecureNote>MFA verification follows when enabled.</SecureNote>
    </AuthLayout>
  );
}
