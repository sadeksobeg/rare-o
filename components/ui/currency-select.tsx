"use client";

import {
  coercePlatformCurrency,
  PLATFORM_CURRENCY_CODES,
  type PlatformCurrencyCode,
} from "@/lib/catalog/currency";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
} from "@/lib/ui/form-classes";
import { cn } from "@/lib/utils";

export type CurrencySelectLabels = {
  currency: string;
  currencyUsd: string;
  currencySyp: string;
  currencyHelp?: string;
};

type Props = {
  name?: string;
  labels: CurrencySelectLabels;
  defaultValue?: string | null;
  value?: string;
  onChange?: (code: PlatformCurrencyCode) => void;
  required?: boolean;
  className?: string;
  id?: string;
};

export function CurrencySelect({
  name = "currency",
  labels,
  defaultValue,
  value,
  onChange,
  required,
  className,
  id,
}: Props) {
  const controlled = value !== undefined;
  const initial = coercePlatformCurrency(value ?? defaultValue);

  return (
    <label className={cn(controlLabelClass, className)}>
      <span className={controlLabelTextClass}>
        {labels.currency}
        {required ? " *" : ""}
      </span>
      <select
        id={id ?? name}
        name={name}
        required={required}
        dir="ltr"
        className={controlClass}
        {...(controlled
          ? {
              value: coercePlatformCurrency(value),
              onChange: (e) =>
                onChange?.(e.target.value as PlatformCurrencyCode),
            }
          : { defaultValue: initial })}
      >
        {PLATFORM_CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {code === "USD" ? labels.currencyUsd : labels.currencySyp}
          </option>
        ))}
      </select>
      {labels.currencyHelp ? (
        <span className="block text-xs text-ro-muted">{labels.currencyHelp}</span>
      ) : null}
    </label>
  );
}
