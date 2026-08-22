"use client";

import { useMemo } from "react";
import { currencyOptions } from "@/lib/i18n/config";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

/**
 * A searchable currency picker — every supported currency by localized name,
 * with its symbol and ISO code. Matches the language & country pickers exactly.
 */
export function CurrencySelect({
  label,
  value,
  onChange,
  locale = "en",
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  locale?: string;
}) {
  const options = useMemo<SelectOption[]>(
    () =>
      currencyOptions(locale).map((o) => ({
        value: o.code,
        primary: o.name,
        trailing: o.code,
        leading: <span className="text-sm font-semibold text-[var(--text-body)]">{o.symbol}</span>,
        search: `${o.code} ${o.symbol}`,
      })),
    [locale],
  );

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select currency"
      searchPlaceholder="Search currency…"
      showTriggerLeading
      emptyText="No currency matches."
    />
  );
}
