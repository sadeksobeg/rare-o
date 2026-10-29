"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { LogoScene } from "@/components/brand/logo-scene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocaleToggle } from "@/components/brand/locale-toggle";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n";
import { loginDict } from "@/lib/dictionaries";

type Role = "admin" | "trader";

export default function LoginPage() {
  const router = useRouter();
  const t = useDict(loginDict);
  const headlineWords = t("headline").split(" ");
  const copy: Record<Role, { title: string; subtitle: string }> = {
    admin: { title: t("adminTitle"), subtitle: t("adminSubtitle") },
    trader: { title: t("traderTitle"), subtitle: t("traderSubtitle") },
  };
  const [role, setRole] = useState<Role>("admin");
  const [view, setView] = useState<"form" | "forgot" | "success">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      setRateLimited(true);
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      if (next < 2) {
        setError(t("invalidCredentials"));
      } else {
        setView("success");
        setTimeout(() => router.push(role === "admin" ? "/admin" : "/trader"), 1100);
      }
    }, 900);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[1.15fr_1fr]">
      {/* ---- living brand scene ---- */}
      <section className="relative hidden min-h-[52vh] flex-col justify-between overflow-hidden bg-ro-ink-950 p-8 text-ro-sand-100 md:flex md:min-h-screen">
        <div className="pointer-events-none absolute inset-[-10%] bg-[radial-gradient(38%_46%_at_24%_28%,rgba(82,39,124,0.55),transparent_60%),radial-gradient(44%_50%_at_78%_70%,rgba(184,134,63,0.22),transparent_62%),radial-gradient(60%_60%_at_50%_100%,rgba(50,16,79,0.65),transparent_65%)]" />
        <div className="absolute inset-0 top-[8%] bottom-[34%]">
          <LogoScene className="h-full w-full" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 font-[family-name:var(--font-heading)] text-h3">
            <img src="/brand/logo-mark-small.svg" alt="" className="h-6 w-6 invert" />
            RARE OUD
          </div>
          <LocaleToggle className="border-ro-sand-100/30 bg-transparent text-ro-sand-100 hover:bg-ro-sand-100/10" />
        </div>
        <div className="relative z-10 rounded-t-2xl bg-gradient-to-t from-ro-ink-950 via-ro-ink-950/70 to-transparent px-2 pt-16 pb-2 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-2 text-small text-ro-plum-300"
          >
            {t("tagline")}
          </motion.p>
          <h2 className="mx-auto max-w-[16ch] font-[family-name:var(--font-heading)] text-h2 text-ro-sand-100">
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </h2>
        </div>
      </section>

      {/* ---- form panel ---- */}
      <section className="flex items-center justify-center bg-ro-sand-100 p-6 md:p-10">
        <div className="w-full max-w-sm rounded-xl border border-white/50 bg-ro-sand-50 p-8 shadow-[inset_0_1px_0_rgba(244,231,216,.08),0_1px_2px_rgba(11,8,13,.06),0_8px_24px_-12px_rgba(11,8,13,.18)]">
          <div className="mb-4 flex justify-end md:hidden">
            <LocaleToggle />
          </div>
          {view === "form" && (
            <>
              <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mb-6">
                <TabsList>
                  <TabsTrigger value="admin">{t("roleAdmin")}</TabsTrigger>
                  <TabsTrigger value="trader">{t("roleTrader")}</TabsTrigger>
                </TabsList>
              </Tabs>

              <h1 className="mb-1 text-h1 font-semibold font-[family-name:var(--font-heading)]">{copy[role].title}</h1>
              <p className="mb-6 text-small text-muted-foreground">{copy[role].subtitle}</p>

              {rateLimited && (
                <div className="mb-4 flex items-start gap-2 rounded-md bg-ro-danger-100 p-3 text-small text-ro-danger-700">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                  <span>{t("rateLimited")}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className={cn(rateLimited && "pointer-events-none opacity-50")}>
                <div className="mb-4 space-y-1.5">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" type="email" dir="ltr" defaultValue="admin@rareoud.example" autoComplete="username" required />
                </div>
                <div className="relative mb-1.5 space-y-1.5">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    defaultValue="correct-horse-battery"
                    autoComplete="current-password"
                    required
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-inline-end-3 top-9 text-muted-foreground"
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? <EyeOff className="size-5" strokeWidth={1.5} /> : <Eye className="size-5" strokeWidth={1.5} />}
                  </button>
                </div>
                {capsLock && (
                  <p className="mb-3 flex items-center gap-1.5 text-caption text-ro-amber-800">
                    <AlertTriangle className="size-4" strokeWidth={1.5} /> {t("capsLockOn")}
                  </p>
                )}

                <div className="mb-5 flex items-center justify-between text-small">
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <input type="checkbox" className="size-4 rounded border-input" /> {t("rememberDevice")}
                  </label>
                  <button type="button" onClick={() => setView("forgot")} className="text-ro-plum-900 underline underline-offset-2">
                    {t("forgotPassword")}
                  </button>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? t("signingIn") : t("signIn")}
                </Button>
                {error && <p className="mt-3 text-center text-caption text-ro-danger-700">{error}</p>}
              </form>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-caption text-muted-foreground">
                <ShieldCheck className="size-4" strokeWidth={1.5} />
                {t("rateLimitFooter")}
              </p>
            </>
          )}

          {view === "forgot" && (
            <>
              <button
                type="button"
                onClick={() => setView("form")}
                className="mb-5 flex items-center gap-1.5 text-small text-muted-foreground"
              >
                {t("backToSignIn")}
              </button>
              <h1 className="mb-1 text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("forgotTitle")}</h1>
              <p className="mb-6 text-small text-muted-foreground">{t("forgotSubtitle")}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setView("form");
                }}
              >
                <div className="mb-5 space-y-1.5">
                  <Label htmlFor="forgot-email">{t("email")}</Label>
                  <Input id="forgot-email" type="email" dir="ltr" required />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  {t("sendRecoveryLink")}
                </Button>
              </form>
            </>
          )}

          {view === "success" && (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 size-16 text-ro-plum-900" />
              <h1 className="mb-1 text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("verified")}</h1>
              <p className="text-small text-muted-foreground">{t("openingDashboard")}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
