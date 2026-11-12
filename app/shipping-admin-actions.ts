"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions";
import {
  handleAdminSessionError,
  requireAdminSession,
} from "@/lib/auth/admin-session";
import {
  bulkAdjustRates,
  copyRateToCountries,
  deleteCountry,
  deleteMethod,
  deleteRate,
  exportRatesCsv,
  importRatesCsv,
  listRateHistory,
  revertRate,
  saveConfig,
  saveCountry,
  saveMethod,
  saveRate,
  setRatesActive,
  setRatesVerified,
  updateInquiry,
  type ConfigInput,
  type MethodInput,
} from "@/lib/shipping/admin-service";
import type { RateInput } from "@/lib/shipping/admin-validate";
import { quote, type QuoteAudience } from "@/lib/shipping/engine";

function revalidateShipping(extra?: string) {
  revalidatePath("/admin/shipping");
  if (extra) revalidatePath(extra);
}

async function withAdmin<T>(
  run: (actor: string, adminId: string) => Promise<T>
): Promise<T | ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  return run(session.name || session.email || session.sub, session.sub);
}

async function audit(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: Record<string, unknown>
) {
  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId,
    action,
    targetType,
    targetId,
    meta,
  });
}

function parseJsonField<T>(raw: FormDataEntryValue | null): T | null {
  if (raw == null || typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function boolFromForm(v: FormDataEntryValue | null, fallback = false) {
  if (v == null) return fallback;
  const s = String(v);
  return s === "on" || s === "true" || s === "1";
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function shippingSaveCountryAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const res = await saveCountry({
      code: String(formData.get("code") || ""),
      nameAr: String(formData.get("nameAr") || ""),
      nameEn: String(formData.get("nameEn") || ""),
      region: String(formData.get("region") || "other"),
      active: boolFromForm(formData.get("active"), true),
      inquiryEnabled: boolFromForm(formData.get("inquiryEnabled"), true),
      note: String(formData.get("note") || ""),
      sortOrder: numOrNull(formData.get("sortOrder")) ?? undefined,
      create: boolFromForm(formData.get("create")),
    });
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.country.save", "shippingCountry", res.data.code, {
      actor,
    });
    revalidateShipping("/admin/shipping/countries");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingDeleteCountryAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const code = String(formData.get("code") || "");
    const res = await deleteCountry(code);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.country.delete", "shippingCountry", code, {
      actor,
      mode: res.data.mode,
    });
    revalidateShipping("/admin/shipping/countries");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingSaveMethodAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const classesRaw = String(formData.get("allowedClasses") || "");
    const input: MethodInput = {
      id: String(formData.get("id") || "") || undefined,
      code: String(formData.get("code") || ""),
      labelAr: String(formData.get("labelAr") || ""),
      labelEn: String(formData.get("labelEn") || ""),
      mode: String(formData.get("mode") || "LAND"),
      speed: String(formData.get("speed") || "") || null,
      security: String(formData.get("security") || "") || null,
      consolidation: boolFromForm(formData.get("consolidation")),
      consolidationNote: String(formData.get("consolidationNote") || ""),
      carrierLabel: String(formData.get("carrierLabel") || ""),
      trackingUrlTemplate: String(formData.get("trackingUrlTemplate") || "") || null,
      etaMinDays: numOrNull(formData.get("etaMinDays")),
      etaMaxDays: numOrNull(formData.get("etaMaxDays")),
      description: String(formData.get("description") || ""),
      allowedClasses: classesRaw
        ? classesRaw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
        : [],
      active: boolFromForm(formData.get("active"), true),
      sortOrder: numOrNull(formData.get("sortOrder")) ?? 0,
    };
    const res = await saveMethod(input);
    if (!res.ok) return { ok: false as const, error: res.error, data: res.issues };
    await audit(adminId, "shipping.method.save", "shippingMethod", res.data.id, {
      actor,
      code: input.code,
    });
    revalidateShipping("/admin/shipping/methods");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingDeleteMethodAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const id = String(formData.get("id") || "");
    const res = await deleteMethod(id);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.method.delete", "shippingMethod", id, {
      actor,
      mode: res.data.mode,
    });
    revalidateShipping("/admin/shipping/methods");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingSaveRateAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const payload = parseJsonField<RateInput & { id?: string }>(
      formData.get("payload")
    );
    if (!payload) return { ok: false as const, error: "INVALID_PAYLOAD" };
    const res = await saveRate(payload, actor);
    if (!res.ok) return { ok: false as const, error: res.error, data: res.issues };
    await audit(adminId, "shipping.rate.save", "shippingRate", res.data.id, {
      actor,
      created: res.data.created,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingDeleteRateAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const id = String(formData.get("id") || "");
    const hard = boolFromForm(formData.get("hard"));
    const res = await deleteRate(id, { hard }, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.rate.delete", "shippingRate", id, {
      actor,
      mode: res.data.mode,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingSetRatesVerifiedAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const ids = formData.getAll("ids").map(String).filter(Boolean);
    const verified = boolFromForm(formData.get("verified"));
    const res = await setRatesVerified(ids, verified, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, verified ? "shipping.rate.verify" : "shipping.rate.unverify", undefined, undefined, {
      actor,
      ids,
      changed: res.data.changed,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingSetRatesActiveAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const ids = formData.getAll("ids").map(String).filter(Boolean);
    const active = boolFromForm(formData.get("active"));
    const res = await setRatesActive(ids, active, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, active ? "shipping.rate.activate" : "shipping.rate.deactivate", undefined, undefined, {
      actor,
      ids,
      changed: res.data.changed,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingBulkAdjustRatesAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const ids = formData.getAll("ids").map(String).filter(Boolean);
    const kind = String(formData.get("kind") || "percent") as "percent" | "fixed";
    const value = Number(formData.get("value"));
    if (kind !== "percent" && kind !== "fixed") {
      return { ok: false as const, error: "VALIDATION" };
    }
    const res = await bulkAdjustRates(ids, { kind, value }, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.rate.bulk_adjust", undefined, undefined, {
      actor,
      ids,
      kind,
      value,
      changed: res.data.changed,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingCopyRateAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const rateId = String(formData.get("rateId") || "");
    const codesRaw = String(formData.get("countryCodes") || "");
    const codes = codesRaw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await copyRateToCountries(rateId, codes, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.rate.copy", "shippingRate", rateId, {
      actor,
      ...res.data,
    });
    revalidateShipping("/admin/shipping/rates");
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingRevertRateAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const historyId = String(formData.get("historyId") || "");
    const res = await revertRate(historyId, actor);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.rate.revert", "shippingRate", res.data.rateId, {
      actor,
      historyId,
    });
    revalidateShipping(`/admin/shipping/rates/${res.data.rateId}`);
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingListRateHistoryAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async () => {
    const rateId = String(formData.get("rateId") || "");
    const rows = await listRateHistory(rateId);
    return {
      ok: true as const,
      data: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actor: r.actor,
        at: r.at.toISOString(),
        hasBefore: r.before != null,
      })),
    };
  });
  return out as ActionResult;
}

export async function shippingSaveConfigAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const input: ConfigInput = {
      roundingRule: String(formData.get("roundingRule") || "legacy_2dp"),
      volumetricDivisor: numOrNull(formData.get("volumetricDivisor")),
      packagingKg: numOrNull(formData.get("packagingKg")) ?? 0,
      globalFreeShippingOver: numOrNull(formData.get("globalFreeShippingOver")),
      insuranceEnabled: boolFromForm(formData.get("insuranceEnabled")),
      insurancePercent: numOrNull(formData.get("insurancePercent")),
      whatsappOptInTextAr: String(formData.get("whatsappOptInTextAr") || ""),
      whatsappOptInTextEn: String(formData.get("whatsappOptInTextEn") || ""),
      inquiryNoteAr: String(formData.get("inquiryNoteAr") || ""),
      inquiryNoteEn: String(formData.get("inquiryNoteEn") || ""),
    };
    const res = await saveConfig(input);
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.config.save", "shippingConfig", "default", {
      actor,
    });
    revalidateShipping("/admin/shipping/config");
    return { ok: true as const };
  });
  return out as ActionResult;
}

export async function shippingUpdateInquiryAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const id = String(formData.get("id") || "");
    const res = await updateInquiry({
      id,
      status: String(formData.get("status") || "NEW"),
      notes: String(formData.get("notes") || ""),
      assignee: String(formData.get("assignee") || "") || null,
    });
    if (!res.ok) return { ok: false as const, error: res.error };
    await audit(adminId, "shipping.inquiry.update", "shippingInquiry", id, {
      actor,
    });
    revalidateShipping("/admin/shipping/inquiries");
    return { ok: true as const };
  });
  return out as ActionResult;
}

export async function shippingImportCsvAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const text = String(formData.get("csv") || "");
    const apply = boolFromForm(formData.get("apply"));
    const res = await importRatesCsv(text, { apply }, actor);
    if (!res.ok) return { ok: false as const, error: res.error, data: res };
    if (apply) {
      await audit(adminId, "shipping.rate.import", undefined, undefined, {
        actor,
        counts: res.data.counts,
      });
      revalidateShipping("/admin/shipping/rates");
    }
    return { ok: true as const, data: res.data };
  });
  return out as ActionResult;
}

export async function shippingExportCsvAction(): Promise<ActionResult> {
  const out = await withAdmin(async (actor, adminId) => {
    const csv = await exportRatesCsv();
    await audit(adminId, "shipping.rate.export", undefined, undefined, { actor });
    return { ok: true as const, data: { csv } };
  });
  return out as ActionResult;
}

export async function shippingSimulateQuoteAction(
  formData: FormData
): Promise<ActionResult> {
  const out = await withAdmin(async () => {
    const destinationCode = String(formData.get("destinationCode") || "");
    const weightKg = numOrNull(formData.get("weightKg"));
    const audience = (String(formData.get("audience") || "CUSTOMER") === "TRADER"
      ? "TRADER"
      : "CUSTOMER") as QuoteAudience;
    const includeUnverified = boolFromForm(formData.get("includeUnverified"));
    if (!destinationCode) return { ok: false as const, error: "VALIDATION" };
    const result = await quote({
      destinationCode,
      weightKg,
      audience,
      includeUnverified,
    });
    return { ok: true as const, data: result };
  });
  return out as ActionResult;
}
