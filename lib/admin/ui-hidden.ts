/**
 * Dev / regression fixtures that must stay in the DB for scripts
 * but must not appear in admin or storefront UI lists.
 */
const HIDDEN_CUSTOMER_NAMES = ["Regression Customer"];
const HIDDEN_CUSTOMER_PHONES = ["+10000000001"];

export function isUiHiddenCustomerName(name: string | null | undefined): boolean {
  if (!name) return false;
  return HIDDEN_CUSTOMER_NAMES.includes(name.trim());
}

export function isUiHiddenCustomerPhone(
  phone: string | null | undefined
): boolean {
  if (!phone) return false;
  return HIDDEN_CUSTOMER_PHONES.includes(phone.trim());
}

/** Prisma `where` fragment: exclude regression/dev fixtures from UI queries. */
export const uiVisibleCustomerWhere = {
  NOT: {
    OR: [
      { name: { in: HIDDEN_CUSTOMER_NAMES } },
      { phone: { in: HIDDEN_CUSTOMER_PHONES } },
    ],
  },
};

export const uiVisibleRetailRequestWhere = {
  NOT: {
    OR: [
      { customerName: { in: HIDDEN_CUSTOMER_NAMES } },
      { customerPhone: { in: HIDDEN_CUSTOMER_PHONES } },
    ],
  },
};
