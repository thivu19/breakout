import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Mail, ShieldPlus } from "lucide-react";
import { AuthLayout } from "@/components/breakout/auth-layout";
import { CheckBox, Field, OrDivider, PasswordField, SecureNote, SsoButton } from "@/components/breakout/form-fields";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create your workspace — Breakout" },
      { name: "description", content: "Set up a Breakout workspace and bring your incident response team into one command center." },
      { property: "og:title", content: "Create your workspace — Breakout" },
      { property: "og:description", content: "Set up a Breakout workspace and bring your incident response team into one command center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/command-center" });
      return;
    }
    // Email confirmation is on: no session until the link is clicked.
    setConfirmEmail(email);
  };

  return (
    <AuthLayout
      headline={<>When every second counts, take control.</>}
      topRight={
        <>
          Already have a workspace?{" "}
          <Link to="/login" className="ml-1 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            Log in <ArrowUpRight className="size-4" />
          </Link>
        </>
      }
    >
      <p className="eyebrow flex items-center gap-2 text-muted-foreground">
        <ShieldPlus className="size-4 text-primary" />
        Establish your workspace
      </p>
      <h2 className="mt-3 text-4xl font-normal tracking-tight text-foreground">Build your response team.</h2>
      <p className="mt-3 text-muted-foreground">Create your account. Bring clarity to your next incident.</p>

      {confirmEmail ? (
        <div className="mt-7 rounded-lg border border-border bg-panel px-5 py-6">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Mail className="size-4 text-primary" /> Confirm your email
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{confirmEmail}</span>. Open it
            to activate your account, then log in.
          </p>
          <Button variant="signal" size="xl" className="mt-5 w-full" asChild>
            <Link to="/login">
              <ArrowRight />
              Go to log in
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-7">
          <SsoButton />
          <OrDivider />
          <div className="space-y-5">
            <Field label="Full name" name="name" placeholder="Alex Morgan" autoComplete="name" required />
            <Field label="Work email" name="email" type="email" placeholder="alex@acme.com" autoComplete="email" icon={<Mail />} required />
            <Field label="Workspace name" name="workspace" placeholder="Acme Security" required />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••••••••"
              minLength={12}
              hint="Use 12+ characters, including a number and a symbol."
              required
            />
          </div>
          <div className="mt-5">
            <CheckBox checked={agreed} onChange={setAgreed}>
              I agree to the Terms of Service and Privacy Policy.
            </CheckBox>
          </div>
          {error && (
            <p className="mt-4 rounded-md border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" variant="signal" size="xl" className="mt-6 w-full" disabled={!agreed || busy}>
            <ArrowRight />
            {busy ? "Creating workspace…" : "Create workspace"}
          </Button>
        </form>
      )}
      <SecureNote>Encrypted by default. Controlled by you.</SecureNote>
    </AuthLayout>
  );
}
