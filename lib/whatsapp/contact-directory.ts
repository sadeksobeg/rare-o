/**
 * In-memory WhatsApp contact / LID↔phone directory (worker process).
 * Feeds display names and real E.164 when chats use anonymous @lid ids.
 */

import {
  e164FromPnHint,
  e164FromRemoteJid,
  isLidJid,
  isPhoneUserJid,
  jidUser,
  normalizeUserJid,
} from "@/lib/whatsapp/jid";

export type ContactIdentity = {
  /** Stable chat addressing jid (may be @lid or @s.whatsapp.net) */
  chatJid: string;
  /** Phone user jid when known */
  pnJid: string | null;
  /** Digits-only E.164 when known */
  e164: string | null;
  /** Best human label (address-book name > notify > verified) */
  displayName: string | null;
};

type ContactRow = {
  lidJid: string | null;
  pnJid: string | null;
  e164: string | null;
  name: string | null;
  notify: string | null;
  verifiedName: string | null;
};

function pickName(row: ContactRow): string | null {
  const name = row.name?.trim();
  if (name) return name;
  const notify = row.notify?.trim();
  if (notify) return notify;
  const verified = row.verifiedName?.trim();
  if (verified) return verified;
  return null;
}

function mergeRow(base: ContactRow, patch: Partial<ContactRow>): ContactRow {
  return {
    lidJid: patch.lidJid ?? base.lidJid,
    pnJid: patch.pnJid ?? base.pnJid,
    e164: patch.e164 ?? base.e164,
    name: patch.name?.trim() ? patch.name.trim() : base.name,
    notify: patch.notify?.trim() ? patch.notify.trim() : base.notify,
    verifiedName: patch.verifiedName?.trim()
      ? patch.verifiedName.trim()
      : base.verifiedName,
  };
}

export class WhatsAppContactDirectory {
  private byLid = new Map<string, ContactRow>();
  private byPn = new Map<string, ContactRow>();

  clear(): void {
    this.byLid.clear();
    this.byPn.clear();
  }

  upsertContact(input: {
    id?: string | null;
    lid?: string | null;
    jid?: string | null;
    name?: string | null;
    notify?: string | null;
    verifiedName?: string | null;
  }): ContactIdentity | null {
    const id = input.id?.trim() || null;
    let lidJid =
      (input.lid && normalizeUserJid(input.lid)) ||
      (id && isLidJid(id) ? id : null);
    let pnJid =
      (input.jid && normalizeUserJid(input.jid)) ||
      (id && isPhoneUserJid(id) ? id : null);

    if (lidJid && !isLidJid(lidJid)) lidJid = null;
    if (pnJid && !isPhoneUserJid(pnJid)) pnJid = null;

    if (!lidJid && !pnJid) return null;

    const e164 = pnJid ? e164FromRemoteJid(pnJid) : null;
    const patch: ContactRow = {
      lidJid,
      pnJid,
      e164,
      name: input.name?.trim() || null,
      notify: input.notify?.trim() || null,
      verifiedName: input.verifiedName?.trim() || null,
    };

    let row: ContactRow = patch;
    if (lidJid && this.byLid.has(lidJid)) {
      row = mergeRow(this.byLid.get(lidJid)!, patch);
    } else if (pnJid && this.byPn.has(pnJid)) {
      row = mergeRow(this.byPn.get(pnJid)!, patch);
    }

    if (row.lidJid) this.byLid.set(row.lidJid, row);
    if (row.pnJid) this.byPn.set(row.pnJid, row);

    return this.toIdentity(row, row.lidJid || row.pnJid || id || "");
  }

  /** Explicit LID → phone share from WhatsApp. */
  linkLidToPn(lid: string, pn: string): ContactIdentity | null {
    const lidJid = normalizeUserJid(lid);
    const pnJid = normalizeUserJid(pn);
    if (!lidJid || !isLidJid(lidJid) || !pnJid || !isPhoneUserJid(pnJid)) {
      return null;
    }
    return this.upsertContact({ id: lidJid, lid: lidJid, jid: pnJid });
  }

  resolve(
    chatJid: string,
    opts?: {
      senderPn?: string | null;
      participantPn?: string | null;
      pushName?: string | null;
    }
  ): ContactIdentity {
    const jid = chatJid.trim();
    const pnHint = opts?.senderPn || opts?.participantPn || null;
    const hintE164 = e164FromPnHint(pnHint);
    const hintPnJid = hintE164 ? `${hintE164}@s.whatsapp.net` : null;

    let row: ContactRow | undefined;
    if (isLidJid(jid)) row = this.byLid.get(jid);
    else if (isPhoneUserJid(jid)) row = this.byPn.get(jid);

    if (!row && hintPnJid) row = this.byPn.get(hintPnJid);

    if (pnHint) {
      this.upsertContact({
        id: isLidJid(jid) ? jid : hintPnJid,
        lid: isLidJid(jid) ? jid : undefined,
        jid: hintPnJid,
        notify: opts?.pushName,
      });
      if (isLidJid(jid)) row = this.byLid.get(jid);
      else if (hintPnJid) row = this.byPn.get(hintPnJid);
    }

    const e164 =
      row?.e164 ||
      hintE164 ||
      (isPhoneUserJid(jid) ? e164FromRemoteJid(jid) : null);

    const displayName =
      pickName(
        row ?? {
          lidJid: null,
          pnJid: null,
          e164: null,
          name: null,
          notify: null,
          verifiedName: null,
        }
      ) || opts?.pushName?.trim() || null;

    return {
      chatJid: jid,
      pnJid: row?.pnJid || hintPnJid,
      e164,
      displayName,
    };
  }

  private toIdentity(row: ContactRow, chatJid: string): ContactIdentity {
    return {
      chatJid,
      pnJid: row.pnJid,
      e164: row.e164,
      displayName: pickName(row),
    };
  }
}

/** Debug helper — not for UI. */
export function describeJidBrief(jid: string): string {
  if (isLidJid(jid)) {
    const u = jidUser(jid);
    return `lid:${u.slice(0, 4)}…`;
  }
  const e164 = e164FromRemoteJid(jid);
  return e164 ? `+${e164}` : jid;
}
