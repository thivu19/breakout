import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Building2, Check, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Field({
  label,
  icon,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex h-12 items-center gap-3 rounded-md border border-input bg-inset px-3.5 transition-colors focus-within:border-primary/60">
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
        <input
          id={id}
          className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-subtle"
          {...props}
        />
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PasswordField({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex h-12 items-center gap-3 rounded-md border border-input bg-inset px-3.5 transition-colors focus-within:border-primary/60">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="h-full w-full bg-transparent text-base tracking-wide text-foreground outline-none placeholder:text-subtle"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-muted-foreground hover:text-foreground"
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckBox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded border transition-colors peer-focus-visible:ring-1 peer-focus-visible:ring-ring",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-inset",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      {children}
    </label>
  );
}

export function SsoButton() {
  return (
    <Button type="button" variant="panel" size="xl" className="w-full">
      <Building2 className="text-muted-foreground" />
      Continue with SSO
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="eyebrow text-subtle">Or continue with email</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function SecureNote({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow mt-6 flex items-center justify-center gap-2 text-subtle">
      <Lock className="size-3.5" />
      {children}
    </p>
  );
}
