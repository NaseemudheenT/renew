"use client";

import { useMemo } from "react";
import { regionOptions } from "@/lib/i18n/config";
import { flagFor } from "@/lib/dial-codes";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

/** A global, searchable country picker — every country, A–Z, localized, with flags. */
export function CountrySelect({
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
      regionOptions(locale).map((o) => ({
        value: o.code,
        primary: o.label,
        trailing: o.code,
        leading: flagFor(o.code),
        search: o.code,
      })),
    [locale],
  );

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select country"
      searchPlaceholder="Search country…"
      showTriggerLeading
      emptyText="No country matches."
    />
  );
}
