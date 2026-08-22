"use client";

import { useMemo } from "react";
import { languageOptions } from "@/lib/i18n/config";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

/**
 * A global, searchable language picker — every language, A–Z, each by its own
 * endonym with the name in the current UI language beneath.
 */
export function LanguageSelect({
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
      languageOptions(locale).map((o) => ({
        value: o.code,
        primary: o.native,
        secondary: o.label,
        trailing: o.code.toUpperCase(),
        search: `${o.label} ${o.native}`,
      })),
    [locale],
  );

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select language"
      searchPlaceholder="Search language…"
      emptyText="No language matches."
    />
  );
}
