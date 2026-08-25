"use client";

import { useMemo } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  categoriesFor,
  customCatMeta,
  resolveCatMeta,
  subcategoriesFor,
  type CatMeta,
} from "@/lib/finance";
import type { TxType, CustomCategory } from "@/lib/types";

export interface CategoriesApi {
  /** The user's custom categories. */
  custom: CustomCategory[];
  /** Built-in + custom categories for a transaction type. */
  forType: (type: TxType) => CatMeta[];
  /** Resolve any category id to its meta (built-in or custom). */
  resolve: (id: string) => CatMeta;
  /** All subcategories for a category — built-in plus the user's own. */
  subsFor: (categoryId: string) => string[];
}

/**
 * Categories merged from the built-in set and the user's custom categories
 * (stored on their profile). Use `resolve` wherever a stored category id is
 * displayed so custom labels/icons render correctly everywhere.
 */
export function useCategories(): CategoriesApi {
  const { profile } = useUserProfile();
  const custom = useMemo(
    () => profile?.customCategories ?? [],
    [profile?.customCategories],
  );
  const customSubs = useMemo(
    () => profile?.customSubcategories ?? {},
    [profile?.customSubcategories],
  );

  return useMemo(
    () => ({
      custom,
      forType: (type: TxType) => [
        ...categoriesFor(type),
        ...custom.filter((c) => c.type === type).map(customCatMeta),
      ],
      resolve: (id: string) => resolveCatMeta(id, custom),
      subsFor: (categoryId: string) => {
        // Built-in subs first, then the user's own — de-duplicated, order kept.
        const merged = [...subcategoriesFor(categoryId), ...(customSubs[categoryId] ?? [])];
        return Array.from(new Set(merged));
      },
    }),
    [custom, customSubs],
  );
}
