"use server";

import type { ActionResult } from "@/app/actions";

/** Dev fixture only — never authenticates. */
export async function noopLoginAction(
  _prev: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  return { ok: false, error: "DEV_FIXTURE" };
}
