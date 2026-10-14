/**
 * Dev / regression fixtures that must stay in the DB for scripts
 * but must not appear in admin, trader, or storefront UI lists.
 *
 * Set `RO_SHOW_UI_FIXTURES=1` to reveal them in development only.
 */

const HIDDEN_CUSTOMER_NAMES = ["Regression Customer"];
const HIDDEN_CUSTOMER_PHONES = ["+10000000001"];

const HIDDEN_TRADER_NAMES = ["Reg Trader A", "Reg Trader B"];
const HIDDEN_TRADER_EMAILS = [
  "reg-trader-a@rareoud.local",
  "reg-trader-b@rareoud.local",
];

const HIDDEN_DEAL_TITLES = [
  "Regression catalog deal",
  "Non-catalog opportunity",
];

/** When true, fixture rows appear in UI (local debugging only). */
export function showUiFixtures(): boolean {
  return process.env.RO_SHOW_UI_FIXTURES === "1";
}

function hiding(): boolean {
  return !showUiFixtures();
}

export function isUiHiddenCustomerName(name: string | null | undefined): boolean {
  if (!hiding() || !name) return false;
  return HIDDEN_CUSTOMER_NAMES.includes(name.trim());
}

export function isUiHiddenCustomerPhone(
  phone: string | null | undefined
): boolean {
  if (!hiding() || !phone) return false;
  return HIDDEN_CUSTOMER_PHONES.includes(phone.trim());
}

export function isUiHiddenTraderName(name: string | null | undefined): boolean {
  if (!hiding() || !name) return false;
  return HIDDEN_TRADER_NAMES.includes(name.trim());
}

export function isUiHiddenTraderEmail(
  email: string | null | undefined
): boolean {
  if (!hiding() || !email) return false;
  return HIDDEN_TRADER_EMAILS.includes(email.trim().toLowerCase());
}

export function isUiHiddenDealTitle(title: string | null | undefined): boolean {
  if (!hiding() || !title) return false;
  return HIDDEN_DEAL_TITLES.includes(title.trim());
}

export function isUiHiddenReference(ref: string | null | undefined): boolean {
  if (!hiding() || !ref) return false;
  const r = ref.trim().toUpperCase();
  return (
    r.startsWith("DL-SEED-") ||
    r.startsWith("WS-SEED-") ||
    r.startsWith("REG-")
  );
}

type Where = Record<string, unknown>;

function emptyWhere(): Where {
  return {};
}

/** Prisma `where` fragment: exclude regression/dev fixtures from UI queries. */
export function uiVisibleCustomerWhere(): Where {
  if (!hiding()) return emptyWhere();
  return {
    NOT: {
      OR: [
        { name: { in: HIDDEN_CUSTOMER_NAMES } },
        { phone: { in: HIDDEN_CUSTOMER_PHONES } },
      ],
    },
  };
}

export function uiVisibleRetailRequestWhere(): Where {
  if (!hiding()) return emptyWhere();
  return {
    NOT: {
      OR: [
        { customerName: { in: HIDDEN_CUSTOMER_NAMES } },
        { customerPhone: { in: HIDDEN_CUSTOMER_PHONES } },
      ],
    },
  };
}

export function uiVisibleTraderWhere(): Where {
  if (!hiding()) return emptyWhere();
  return {
    NOT: {
      OR: [
        { displayName: { in: HIDDEN_TRADER_NAMES } },
        { email: { in: HIDDEN_TRADER_EMAILS } },
      ],
    },
  };
}

export function uiVisibleDealWhere(): Where {
  if (!hiding()) return emptyWhere();
  return {
    NOT: {
      OR: [
        { title: { in: HIDDEN_DEAL_TITLES } },
        { reference: { startsWith: "DL-SEED-" } },
        { reference: { startsWith: "REG-" } },
        { trader: { displayName: { in: HIDDEN_TRADER_NAMES } } },
        { trader: { email: { in: HIDDEN_TRADER_EMAILS } } },
      ],
    },
  };
}

export function uiVisibleWholesaleWhere(): Where {
  if (!hiding()) return emptyWhere();
  return {
    NOT: {
      OR: [
        { reference: { startsWith: "WS-SEED-" } },
        { reference: { startsWith: "REG-" } },
        { trader: { displayName: { in: HIDDEN_TRADER_NAMES } } },
        { trader: { email: { in: HIDDEN_TRADER_EMAILS } } },
      ],
    },
  };
}
