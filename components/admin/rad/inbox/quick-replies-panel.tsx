"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteQuickReplyAction,
  adminFillQuickReplyAction,
  adminListQuickRepliesAction,
  adminUpsertQuickReplyAction,
} from "@/app/whatsapp-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { QuickReplyTemplateView } from "@/lib/whatsapp/messaging/quick-replies";
import { cn } from "@/lib/utils";

type DraftForm = {
  id?: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

export function QuickRepliesPanel({
  open,
  onClose,
  locale,
  ib,
  name,
  requestRef,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  ib: Dictionary["ib"];
  name: string | null;
  requestRef: string | null;
  onInsert: (body: string) => void;
}) {
  const [items, setItems] = useState<QuickReplyTemplateView[]>([]);
  const [query, setQuery] = useState("");
  const [managing, setManaging] = useState(false);
  const [form, setForm] = useState<DraftForm | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const res = await adminListQuickRepliesAction(locale);
      if (res.ok && res.data?.items) setItems(res.data.items);
    });
  }, [open, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) || it.body.toLowerCase().includes(q)
    );
  }, [items, query]);

  function insert(template: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("template", template);
      if (name) fd.set("name", name);
      if (requestRef) fd.set("requestRef", requestRef);
      const res = await adminFillQuickReplyAction(fd);
      if (!res.ok || !res.data?.body) {
        toast.error(ib.actionFailed);
        return;
      }
      onInsert(res.data.body);
      onClose();
    });
  }

  function saveForm() {
    if (!form) return;
    startTransition(async () => {
      const fd = new FormData();
      if (form.id) fd.set("id", form.id);
      fd.set("titleAr", form.titleAr);
      fd.set("titleEn", form.titleEn);
      fd.set("bodyAr", form.bodyAr);
      fd.set("bodyEn", form.bodyEn);
      const res = await adminUpsertQuickReplyAction(fd);
      if (!res.ok) {
        toast.error(ib.actionFailed);
        return;
      }
      toast.success(ib.qrSaved);
      setForm(null);
      const list = await adminListQuickRepliesAction(locale);
      if (list.ok && list.data?.items) setItems(list.data.items);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await adminDeleteQuickReplyAction(fd);
      if (!res.ok) {
        toast.error(ib.actionFailed);
        return;
      }
      toast.success(ib.qrDeleted);
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
  }

  if (!open) return null;

  return (
    <div className={cn("rad-qm rad-on rad-qr-panel")} role="dialog" aria-label={ib.quickRepliesLabel}>
      <div className="rad-qr-head">
        <div className="rad-qr-search">
          <Search width={14} height={14} strokeWidth={1.5} aria-hidden />
          <input
            type="search"
            value={query}
            placeholder={ib.qrSearchPlaceholder}
            aria-label={ib.qrSearchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="rad-ib"
          aria-label={ib.qrManage}
          data-tip={ib.qrManage}
          onClick={() => {
            setManaging((v) => !v);
            setForm(null);
          }}
        >
          <Pencil width={14} height={14} strokeWidth={1.5} aria-hidden />
        </button>
        <button type="button" className="rad-ib" aria-label={ib.threadSearchClose} onClick={onClose}>
          <X width={14} height={14} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <p className="rad-qr-hint">{ib.qrVarsHint}</p>

      {managing ? (
        <div className="rad-qr-manage">
          {form ? (
            <div className="rad-qr-form">
              <label>
                <span>{ib.qrTitleAr}</span>
                <input
                  value={form.titleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                />
              </label>
              <label>
                <span>{ib.qrTitleEn}</span>
                <input
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                />
              </label>
              <label>
                <span>{ib.qrBodyAr}</span>
                <textarea
                  rows={3}
                  value={form.bodyAr}
                  onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
                />
              </label>
              <label>
                <span>{ib.qrBodyEn}</span>
                <textarea
                  rows={3}
                  value={form.bodyEn}
                  onChange={(e) => setForm({ ...form, bodyEn: e.target.value })}
                />
              </label>
              <div className="rad-mpv-acts">
                <button type="button" className="rad-btn rad-gh" onClick={() => setForm(null)}>
                  {ib.mediaCancel}
                </button>
                <button
                  type="button"
                  className="rad-btn rad-pri"
                  disabled={pending}
                  onClick={saveForm}
                >
                  {ib.qrSave}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="rad-qr-add"
                onClick={() =>
                  setForm({
                    titleAr: "",
                    titleEn: "",
                    bodyAr: "",
                    bodyEn: "",
                  })
                }
              >
                <Plus width={14} height={14} strokeWidth={1.5} aria-hidden />
                {ib.qrAdd}
              </button>
              {items.map((it) => (
                <div key={it.id} className="rad-qr-row">
                  <div>
                    <b>{it.title}</b>
                    <span>{it.body}</span>
                  </div>
                  <button
                    type="button"
                    className="rad-ib"
                    aria-label={ib.qrEdit}
                    onClick={() =>
                      setForm({
                        id: it.id,
                        titleAr: it.titleAr,
                        titleEn: it.titleEn,
                        bodyAr: it.bodyAr,
                        bodyEn: it.bodyEn,
                      })
                    }
                  >
                    <Pencil width={14} height={14} strokeWidth={1.5} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rad-ib"
                    aria-label={ib.qrDelete}
                    onClick={() => remove(it.id)}
                  >
                    <Trash2 width={14} height={14} strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rad-qr-empty">{ib.qrEmpty}</p>
      ) : (
        filtered.map((it) => (
          <button
            key={it.id}
            type="button"
            disabled={pending}
            onClick={() => insert(it.body)}
          >
            <b>{it.title}</b>
            {it.body}
          </button>
        ))
      )}
    </div>
  );
}
