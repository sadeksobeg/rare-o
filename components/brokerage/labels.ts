import type { BrokerageStatus } from "@/lib/brokerage/status";
import { nextActor } from "@/lib/brokerage/status";

export type BrokeragePhase =
  | "intake"
  | "payment"
  | "inspection"
  | "quote"
  | "fulfillment"
  | "closed";

export type BrokerageAudience = "admin" | "trader";

export type BrokerageStatusMeta = {
  label: { ar: string; en: string };
  phase: BrokeragePhase;
  meaning: { ar: string; en: string };
  nextHint: {
    admin: { ar: string; en: string };
    trader: { ar: string; en: string };
  };
  /** Side-path / terminal — not on the happy-path rail dots */
  side?: boolean;
};

export const BROKERAGE_PHASE_LABEL: Record<
  BrokeragePhase,
  { ar: string; en: string }
> = {
  intake: { ar: "استقبال", en: "Intake" },
  payment: { ar: "الدفع", en: "Payment" },
  inspection: { ar: "معاينة", en: "Inspection" },
  quote: { ar: "عرض (قديم)", en: "Quote (legacy)" },
  fulfillment: { ar: "تنفيذ", en: "Fulfillment" },
  closed: { ar: "إغلاق", en: "Closed" },
};

export const BROKERAGE_STATUS_META: Record<BrokerageStatus, BrokerageStatusMeta> =
  {
    SUBMITTED: {
      label: { ar: "طلب جديد", en: "New request" },
      phase: "intake",
      meaning: {
        ar: "التاجر قدّم طلباً وهو بانتظار مراجعة الإدارة.",
        en: "The trader submitted a request awaiting admin review.",
      },
      nextHint: {
        admin: {
          ar: "راجع التفاصيل: اقبل للمعاينة، اطلب معلومات ناقصة، أو ارفض.",
          en: "Review details: accept for inspection, request missing info, or decline.",
        },
        trader: {
          ar: "بانتظار قرار الإدارة على طلبك.",
          en: "Waiting for admin to review your request.",
        },
      },
    },
    NEEDS_INFO: {
      label: { ar: "بانتظار معلومات", en: "Needs info" },
      phase: "intake",
      side: true,
      meaning: {
        ar: "الإدارة طلبت توضيحاً أو بيانات إضافية من التاجر.",
        en: "Admin asked the trader for clarification or missing details.",
      },
      nextHint: {
        admin: {
          ar: "بانتظار رد التاجر. بعد اكتمال المعلومات يمكنك المتابعة للدفع أو الرفض.",
          en: "Waiting on the trader. Once info is complete you can proceed to payment or decline.",
        },
        trader: {
          ar: "أكمِل المعلومات المطلوبة ثم أعد إرسال الطلب.",
          en: "Provide the requested information and resubmit.",
        },
      },
    },
    AWAITING_PAYMENT: {
      label: { ar: "بانتظار الدفع", en: "Awaiting payment" },
      phase: "payment",
      meaning: {
        ar: "التاجر يدفع عبر واتساب مع الإدارة وبانتظار تأكيد استلام الدفع.",
        en: "Trader pays via WhatsApp with admin; waiting for payment confirmation.",
      },
      nextHint: {
        admin: {
          ar: "بعد استلام التحويل: أكّد نجاح الدفع لفتح بقية المراحل.",
          en: "After receiving the transfer: confirm payment to unlock remaining stages.",
        },
        trader: {
          ar: "افتح واتساب وأتمّ الدفع، ثم انتظر تأكيد الإدارة.",
          en: "Open WhatsApp, complete payment, then wait for admin confirmation.",
        },
      },
    },
    PAYMENT_CONFIRMED: {
      label: { ar: "تأكيد الدفع", en: "Payment confirmed" },
      phase: "payment",
      meaning: {
        ar: "أكدت الإدارة نجاح الدفع. يمكن بدء المعاينة والتنفيذ.",
        en: "Admin confirmed payment. Inspection and fulfillment can begin.",
      },
      nextHint: {
        admin: {
          ar: "اقبل الطلب للمعاينة أو ارفض إن لزم.",
          en: "Accept for inspection or decline if needed.",
        },
        trader: {
          ar: "تم تأكيد الدفع — الإدارة تتابع بقية المراحل.",
          en: "Payment confirmed — admin continues the remaining stages.",
        },
      },
    },
    ACCEPTED: {
      label: { ar: "مقبول للمعاينة", en: "Accepted" },
      phase: "inspection",
      meaning: {
        ar: "قُبل الطلب وانتقل إلى مرحلة ترتيب المعاينة.",
        en: "Request accepted; ready to arrange inspection.",
      },
      nextHint: {
        admin: {
          ar: "جدوِل المعاينة (تاريخ ومكان ومسؤول) للمتابعة.",
          en: "Schedule the inspection (date, place, assignee).",
        },
        trader: {
          ar: "قُبل طلبك — الإدارة ترتّب المعاينة.",
          en: "Accepted — admin is arranging the inspection.",
        },
      },
    },
    INSPECTION_SCHEDULED: {
      label: { ar: "معاينة مجدولة", en: "Inspection scheduled" },
      phase: "inspection",
      meaning: {
        ar: "تم تحديد موعد المعاينة وبانتظار تنفيذها وتوثيق النتيجة.",
        en: "Inspection is scheduled; awaiting completion and report.",
      },
      nextHint: {
        admin: {
          ar: "بعد المعاينة: احفظ تقرير التقدير والتوصية لنقل الطلب للخطوة التالية.",
          en: "After inspecting: save the grade and verdict to advance.",
        },
        trader: {
          ar: "المعاينة مجدولة — ستصلك نتيجة التقرير قريباً.",
          en: "Inspection is scheduled — a report will follow.",
        },
      },
    },
    INSPECTED: {
      label: { ar: "اكتملت المعاينة", en: "Inspected" },
      phase: "fulfillment",
      meaning: {
        ar: "تقرير المعاينة جاهز. الخطوة التالية تنفيذ الشراء (بعد الدفع المؤكد).",
        en: "Inspection report is ready. Next: purchase (payment already confirmed).",
      },
      nextHint: {
        admin: {
          ar: "نفّذ الشراء من المصدر ثم سجّله، أو ارفض إن لزم.",
          en: "Complete the purchase from the source, or decline if needed.",
        },
        trader: {
          ar: "اكتملت المعاينة — الإدارة تتابع الشراء.",
          en: "Inspection done — admin continues with purchase.",
        },
      },
    },
    QUOTE_SENT: {
      label: { ar: "العرض لدى التاجر", en: "Quote with trader" },
      phase: "quote",
      meaning: {
        ar: "أُرسل عرض السعر وهو بانتظار موافقة التاجر أو رفضه.",
        en: "Quote sent; waiting for the trader to approve or reject.",
      },
      nextHint: {
        admin: {
          ar: "لا إجراء إداري الآن — انتظر رد التاجر على العرض.",
          en: "No admin action now — wait for the trader’s decision.",
        },
        trader: {
          ar: "راجع العرض ثم وافق أو ارفض للمتابعة.",
          en: "Review the quote, then approve or decline to continue.",
        },
      },
    },
    APPROVED: {
      label: { ar: "وافق التاجر", en: "Trader approved" },
      phase: "fulfillment",
      meaning: {
        ar: "التاجر وافق على العرض. حان وقت تنفيذ الشراء.",
        en: "Trader approved the quote. Time to execute the purchase.",
      },
      nextHint: {
        admin: {
          ar: "نفّذ الشراء من المصدر ثم سجّله في النظام.",
          en: "Complete the purchase from the source, then mark it purchased.",
        },
        trader: {
          ar: "وافقت على العرض — الإدارة تنفّذ الشراء.",
          en: "You approved — admin is purchasing the piece.",
        },
      },
    },
    PURCHASED: {
      label: { ar: "تم الشراء", en: "Purchased" },
      phase: "fulfillment",
      meaning: {
        ar: "تم شراء القطعة وبانتظار تجهيز الشحن للتاجر.",
        en: "Piece purchased; ready to ship to the trader.",
      },
      nextHint: {
        admin: {
          ar: "سجّل الشحن: اسم الناقل ورقم التتبع.",
          en: "Record shipment: carrier and tracking number.",
        },
        trader: {
          ar: "تم الشراء — بانتظار بيانات الشحن.",
          en: "Purchased — waiting for shipping details.",
        },
      },
    },
    SHIPPED: {
      label: { ar: "قيد الشحن", en: "Shipped" },
      phase: "fulfillment",
      meaning: {
        ar: "الشحنة في الطريق وبانتظار تأكيد وصولها.",
        en: "Shipment is in transit awaiting delivery confirmation.",
      },
      nextHint: {
        admin: {
          ar: "عند وصول الشحنة للتاجر: أكّد التسليم.",
          en: "When the trader receives the parcel: confirm delivery.",
        },
        trader: {
          ar: "الشحنة في الطريق — راقب رقم التتبع.",
          en: "In transit — track with the reference provided.",
        },
      },
    },
    DELIVERED: {
      label: { ar: "تم التسليم", en: "Delivered" },
      phase: "fulfillment",
      meaning: {
        ar: "وصلت الشحنة للتاجر. يبقى إغلاق ملف الوساطة.",
        en: "Delivered to the trader. Close the brokerage file next.",
      },
      nextHint: {
        admin: {
          ar: "أغلق الطلب لإتمام الدورة.",
          en: "Close the request to finish the lifecycle.",
        },
        trader: {
          ar: "تم التسليم — الإدارة تغلق الملف.",
          en: "Delivered — admin will close the file.",
        },
      },
    },
    CLOSED: {
      label: { ar: "مغلق — مكتمل", en: "Closed — complete" },
      phase: "closed",
      meaning: {
        ar: "اكتملت دورة الوساطة بنجاح وأُغلق الملف.",
        en: "Brokerage completed successfully and the file is closed.",
      },
      nextHint: {
        admin: {
          ar: "لا إجراءات متبقية.",
          en: "No further actions.",
        },
        trader: {
          ar: "الطلب مكتمل ومغلق.",
          en: "This request is complete and closed.",
        },
      },
    },
    DECLINED: {
      label: { ar: "مرفوض من الإدارة", en: "Declined by admin" },
      phase: "closed",
      side: true,
      meaning: {
        ar: "رفضت الإدارة متابعة الطلب (قبل أو أثناء المسار).",
        en: "Admin declined to continue this request.",
      },
      nextHint: {
        admin: {
          ar: "الحالة نهائية — لا إجراءات.",
          en: "Terminal — no further actions.",
        },
        trader: {
          ar: "لم تُقبل متابعة هذا الطلب.",
          en: "This request will not proceed.",
        },
      },
    },
    REJECTED: {
      label: { ar: "رفض التاجر العرض", en: "Trader rejected quote" },
      phase: "closed",
      side: true,
      meaning: {
        ar: "التاجر رفض عرض السعر وتوقفت الدورة عند مرحلة العرض.",
        en: "Trader rejected the quote; the cycle stopped at the quote stage.",
      },
      nextHint: {
        admin: {
          ar: "الحالة نهائية بعد رفض العرض.",
          en: "Terminal after quote rejection.",
        },
        trader: {
          ar: "رفضت العرض — الطلب مغلق من جهة العرض.",
          en: "You rejected the quote — this path is closed.",
        },
      },
    },
    CANCELLED: {
      label: { ar: "ملغى", en: "Cancelled" },
      phase: "closed",
      side: true,
      meaning: {
        ar: "أُلغي الطلب ولم يعد نشطاً.",
        en: "The request was cancelled and is no longer active.",
      },
      nextHint: {
        admin: {
          ar: "الحالة نهائية — لا إجراءات.",
          en: "Terminal — no further actions.",
        },
        trader: {
          ar: "هذا الطلب ملغى.",
          en: "This request is cancelled.",
        },
      },
    },
  };

/** @deprecated Prefer brokerageStatusMeta + label helpers */
export const BROKERAGE_STATUS_LABEL: Record<string, { ar: string; en: string }> =
  Object.fromEntries(
    Object.entries(BROKERAGE_STATUS_META).map(([k, v]) => [k, v.label])
  );

export function getBrokerageStatusMeta(status: string): BrokerageStatusMeta {
  return (
    BROKERAGE_STATUS_META[status as BrokerageStatus] ??
    BROKERAGE_STATUS_META.SUBMITTED
  );
}

export function brokerageStatusLabel(status: string, locale: string) {
  const row = getBrokerageStatusMeta(status).label;
  return locale === "ar" ? row.ar : row.en;
}

export function brokeragePhaseLabel(phase: BrokeragePhase, locale: string) {
  const row = BROKERAGE_PHASE_LABEL[phase];
  return locale === "ar" ? row.ar : row.en;
}

export function brokerageMeaning(status: string, locale: string) {
  const row = getBrokerageStatusMeta(status).meaning;
  return locale === "ar" ? row.ar : row.en;
}

export function brokerageNextHint(
  status: string,
  locale: string,
  audience: BrokerageAudience
) {
  const row = getBrokerageStatusMeta(status).nextHint[audience];
  return locale === "ar" ? row.ar : row.en;
}

export function brokerageActorLabel(
  status: string,
  locale: string
): string {
  const actor = nextActor(status);
  if (actor === "admin") return locale === "ar" ? "الإدارة" : "Admin";
  if (actor === "trader") return locale === "ar" ? "التاجر" : "Trader";
  return locale === "ar" ? "منتهٍ" : "Done";
}

export function daysSince(date: Date | string, now = Date.now()) {
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  return Math.max(0, Math.floor((now - t) / 86400000));
}
