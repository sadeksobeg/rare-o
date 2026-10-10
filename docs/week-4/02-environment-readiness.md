# Week 4 — Environment Readiness Check (NO IMPLEMENTATION)

**Date:** 2026-10-05  
**Scope:** Readiness inspection only  
**Not done:** Baileys install, QR auth, schema/migrations, app code changes, deploy  

---

## Results

| Gate | Result | Evidence |
|---|---|---|
| **T1** Hostinger VPS / runtime | **UNKNOWN** (API access **FAIL**) | Hostinger VPS MCP `vps_virtual-machines_list` → **HTTP 401 Unauthenticated** after MCP auth. Hosting list also 401. No local SSH config found for a VPS host. Cannot verify OS, Node, disk, PM2/systemd, or reboot restart from this session. |
| **T2** Dedicated WA number ready | **UNKNOWN** | Per instruction: number not requested/stored. No independent verification possible without your confirmation that the ops number is ready for WhatsApp Web/QR (and not blocked by another Web session). |
| **T3** QR operator | **UNKNOWN** (pending) | Explicitly not confirmed. Remains pending. |
| **T4** Private auth storage approach | **PASS (design)** / **UNKNOWN (on-host)** | Secure approach proposed below. Path cannot be verified on the VPS until T1 access works. |

---

## T1 detail (what could not be verified)

Unable to confirm from tools:

- VPS accessible via SSH/API  
- OS/version  
- Installed Node.js version / ability to use Node 22  
- Persistent disk  
- Long-running worker support (architecturally expected on VPS, but not observed)  
- Existing process manager  
- Auto-restart after reboot/crash  
- Private path protection from web root  

**Capability note:** A Hostinger VPS *in principle* supports always-on Node workers, systemd/PM2, and private directories outside public web roots — but that is **not** a PASS until this specific machine is inspected successfully.

---

## T4 — Proposed secure Baileys auth storage (design only)

**Do not create this directory or any session files until implementation is approved and VPS access exists.**

| Item | Proposal |
|---|---|
| Path | `/var/lib/rare-oud/whatsapp-auth/` (Linux VPS) |
| Permissions | Directory `0700`, owned by dedicated OS user e.g. `rareoud-wa` (not `www-data` / not public FTP user) |
| Web exposure | **Outside** any Nginx/Apache/Caddy document root, Next `public/`, and upload dirs |
| Env | `WHATSAPP_AUTH_DIR=/var/lib/rare-oud/whatsapp-auth` (server-only; never `NEXT_PUBLIC_*`) |
| Git | Path gitignored; never committed |
| Backup ownership | Client/ops owner of VPS backups; encrypted copy of auth dir treated as **secret-class**; restore = stop worker → restore dir → start worker → verify CONNECTED |
| Logs/API | Never dump auth files, keys, or QR private material |

On-host confirmation (chmod/ownership/web-root isolation) still **UNKNOWN** until T1 access.

---

## Real blockers

1. **Cannot inspect Hostinger VPS** from this agent (API 401; no SSH).  
2. **WhatsApp number readiness** not confirmed (T2).  
3. **QR operator** not confirmed (T3).  
4. **Auth storage path** not verified on disk (T4 on-host).  

---

## What you need to provide manually

1. **Hostinger API / VPS access for this agent** (valid token with VPS scope) **or** SSH details / a short readiness dump you run yourself (OS, `node -v`, disk, process manager).  
2. Confirmation: **dedicated ops WhatsApp number is ready for Web/QR** (yes/no only — **do not paste the number**).  
3. **Named QR operator** (role/name) available with controlled phone.  
4. Approval of proposed auth path `/var/lib/rare-oud/whatsapp-auth/` (or your preferred private path).  
5. Optional: confirm process manager preference (systemd vs PM2) once OS is known.

---

## Safest next step

1. Fix Hostinger VPS API authentication **or** paste a **redacted** VPS readiness checklist you run on the server (no secrets).  
2. Answer T2 yes/no + name T3 operator + approve T4 path.  
3. Only then issue **implementation approval** to start Stage A coding.

**Do not** install Baileys or run QR until T1–T3 are PASS (and T4 path approved).

---

## STOP

Conditional architecture approval stands. **Implementation not started.**
