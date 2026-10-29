"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { LocaleToggle } from "@/components/brand/locale-toggle";
import { currentTrader } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { forcePasswordChangeDict } from "@/lib/dictionaries";

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const scoreColor = ["bg-[#8A2433]", "bg-ro-amber-500", "bg-ro-amber-500", "bg-[#1F5130]", "bg-[#1F5130]"];
const scoreLabelKeys = ["strengthWeak", "strengthFair", "strengthGood", "strengthStrong", "strengthVeryStrong"] as const;

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useDict(forcePasswordChangeDict);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const score = useMemo(() => passwordScore(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = score >= 2 && password === confirm && confirm.length > 0;
  const firstName = (locale === "ar" ? currentTrader.name : currentTrader.nameEn).split(" ")[0];

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-ro-sand-100 px-6 py-12">
      <LocaleToggle className="absolute end-6 top-6" />
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-ro-amber-100 text-ro-amber-800">
              <ShieldAlert className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-h1 font-semibold">{t("title")}</h1>
              <p className="text-small text-muted-foreground">
                {locale === "ar" ? `مرحباً ${firstName}` : `Welcome, ${firstName}`} — {t("subtitle")}
              </p>
            </div>
          </div>

          <p className="mb-6 rounded-md border bg-muted/40 p-3 text-small text-muted-foreground">{t("explanation")}</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              router.push("/trader");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">{t("newPassword")}</Label>
              <Input
                id="new-pw"
                type="password"
                dir="ltr"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <Progress value={(score / 4) * 100} className={`h-1.5 [&>div]:${scoreColor[score]}`} />
                  <p className="text-caption text-muted-foreground">
                    {t("strengthLabel")}: {t(scoreLabelKeys[score])}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">{t("confirmPassword")}</Label>
              <Input
                id="confirm-pw"
                type="password"
                dir="ltr"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch}
              />
              {mismatch && <p className="text-caption text-[#8A2433]">{t("mismatch")}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
