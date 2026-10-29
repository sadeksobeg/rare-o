"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { currentTrader } from "@/lib/fixtures";

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const scoreMeta = [
  { labelAr: "ضعيفة", color: "bg-[#8A2433]" },
  { labelAr: "مقبولة", color: "bg-ro-amber-500" },
  { labelAr: "جيدة", color: "bg-ro-amber-500" },
  { labelAr: "قوية", color: "bg-[#1F5130]" },
  { labelAr: "قوية جداً", color: "bg-[#1F5130]" },
];

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const score = useMemo(() => passwordScore(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = score >= 2 && password === confirm && confirm.length > 0;

  return (
    <div className="flex min-h-svh items-center justify-center bg-ro-sand-100 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-ro-amber-100 text-ro-amber-800">
              <ShieldAlert className="size-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-h1 font-semibold">عيّن كلمة مرور جديدة</h1>
              <p className="text-small text-muted-foreground">مرحباً {currentTrader.name.split(" ")[0]} — هذه خطوة لمرة واحدة</p>
            </div>
          </div>

          <p className="mb-6 rounded-md border bg-muted/40 p-3 text-small text-muted-foreground">
            أعادت الإدارة تعيين كلمة مرور حسابك. لأسباب أمنية لا تستطيع الإدارة رؤية كلمة
            مرورك الحالية في أي وقت — عليك اختيار كلمة مرور جديدة الآن قبل المتابعة.
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              router.push("/trader");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">كلمة المرور الجديدة</Label>
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
                  <Progress value={(score / 4) * 100} className={`h-1.5 [&>div]:${scoreMeta[score].color}`} />
                  <p className="text-caption text-muted-foreground">قوة كلمة المرور: {scoreMeta[score].labelAr}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-pw"
                type="password"
                dir="ltr"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch}
              />
              {mismatch && <p className="text-caption text-[#8A2433]">كلمتا المرور غير متطابقتين</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              تعيين كلمة المرور والمتابعة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
