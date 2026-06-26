import { useState } from "react";
import { Link } from "wouter";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), appPath: basePath }),
      });
    } finally {
      setBusy(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that address, we've sent a link to reset your password."
        footer={
          <Link href="/sign-in" className="text-primary font-semibold">
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
          💡 Can't see it? Check your <strong>Important</strong>, <strong>Promotions</strong>, or <strong>Spam</strong> folder — it may have landed there.
        </p>
        <Link href="/sign-in">
          <Button className="w-full bg-primary hover:bg-primary/90 font-bold text-base py-6">
            Back to sign in
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/sign-in" className="text-primary font-semibold">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-primary hover:bg-primary/90 font-bold text-base py-6"
        >
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
