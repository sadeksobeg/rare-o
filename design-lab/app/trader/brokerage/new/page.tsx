"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n";
import { traderBrokerageDict } from "@/lib/dictionaries";
import { toast } from "sonner";

const steps = ["stepWhat", "stepWhere", "stepExpectations", "stepReview"] as const;

export default function NewBrokerageRequestPage() {
  const router = useRouter();
  const t = useDict(traderBrokerageDict);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    description: "",
    category: "",
    quantity: "1",
    photosLink: "",
    city: "",
    placeName: "",
    sellerContact: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    notes: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    toast.success(t("submitted"));
    router.push("/trader/brokerage");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("wizardTitle")}</h1>

      <div className="flex items-start gap-3 rounded-md border bg-ro-plum-50 p-4 text-small text-ro-ink-700">
        <Info className="mt-0.5 size-4 shrink-0 text-ro-plum-700" strokeWidth={1.5} />
        <div>
          <p className="mb-1 font-medium">{t("explainerTitle")}</p>
          <p className="text-muted-foreground">{t("explainerBody")}</p>
        </div>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-2">
        {steps.map((key, i) => (
          <div key={key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-small font-semibold",
                i < step ? "bg-ro-plum-700 text-ro-sand-50" : i === step ? "bg-ro-ink-950 text-ro-sand-50" : "bg-ro-sand-300 text-ro-ink-500"
              )}
            >
              {i < step ? <Check className="size-4" strokeWidth={2} /> : i + 1}
            </div>
            <span className={cn("hidden text-small sm:block", i === step ? "font-semibold" : "text-muted-foreground")}>{t(key)}</span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea id="description" placeholder={t("descriptionPlaceholder")} value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">{t("category")}</Label>
                  <Input id="category" value={form.category} onChange={(e) => update("category", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">{t("quantity")}</Label>
                  <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photosLink">{t("photosLink")}</Label>
                <Input id="photosLink" dir="ltr" value={form.photosLink} onChange={(e) => update("photosLink", e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="placeName">{t("placeName")}</Label>
                  <Input id="placeName" value={form.placeName} onChange={(e) => update("placeName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellerContact">{t("sellerContact")}</Label>
                <Input id="sellerContact" dir="ltr" value={form.sellerContact} onChange={(e) => update("sellerContact", e.target.value)} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>{t("budgetRange")}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="budgetMin" className="text-caption text-muted-foreground">
                      {t("budgetMin")}
                    </Label>
                    <Input id="budgetMin" type="number" dir="ltr" value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="budgetMax" className="text-caption text-muted-foreground">
                      {t("budgetMax")}
                    </Label>
                    <Input id="budgetMax" type="number" dir="ltr" value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeline">{t("timeline")}</Label>
                <Input id="timeline" value={form.timeline} onChange={(e) => update("timeline", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="font-medium">{t("reviewTitle")}</p>
              <dl className="grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
                <div>
                  <dt className="text-caption text-muted-foreground">{t("description")}</dt>
                  <dd>{form.description || "—"}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">{t("category")}</dt>
                  <dd>{form.category || "—"}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">{t("city")}</dt>
                  <dd>{form.city || "—"}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">{t("placeName")}</dt>
                  <dd>{form.placeName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">{t("budgetRange")}</dt>
                  <dd dir="ltr" className="text-end">
                    {form.budgetMin || form.budgetMax ? `$${form.budgetMin || "0"} – $${form.budgetMax || "?"}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">{t("timeline")}</dt>
                  <dd>{form.timeline || "—"}</dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => (step === 0 ? router.push("/trader/brokerage") : setStep((s) => s - 1))}>
          {step === 0 ? t("cancel") : t("back")}
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>{t("next")}</Button>
        ) : (
          <Button onClick={submit}>{t("submit")}</Button>
        )}
      </div>
    </div>
  );
}
