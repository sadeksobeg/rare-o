/** Map getUserMedia failures to actionable inbox copy keys. */
export type MicErrorKind =
  | "denied"
  | "no_device"
  | "policy"
  | "insecure"
  | "unsupported"
  | "unknown";

export function classifyMicError(err: unknown): MicErrorKind {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "insecure";
  }
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name?: string }).name)
      : "";
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "denied";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "no_device";
  }
  if (
    name === "SecurityError" ||
    /permissions policy|permission policy|feature is disabled/i.test(msg)
  ) {
    return "policy";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "unknown";
  }
  return "unknown";
}

export function micErrorMessage(
  kind: MicErrorKind,
  ib: {
    voiceMicDenied: string;
    voiceMicNoDevice: string;
    voiceMicPolicyBlocked: string;
    voiceMicSecureRequired: string;
  }
): string {
  switch (kind) {
    case "denied":
      return ib.voiceMicDenied;
    case "no_device":
      return ib.voiceMicNoDevice;
    case "policy":
      return ib.voiceMicPolicyBlocked;
    case "insecure":
      return ib.voiceMicSecureRequired;
    case "unsupported":
      return ib.voiceMicNoDevice;
    default:
      return ib.voiceMicDenied;
  }
}
