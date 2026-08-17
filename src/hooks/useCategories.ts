"use client";

import { useMemo } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  categoriesFor,
  customCatMeta,
  resolveCatMeta,
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

  return useMemo(
    () => ({
      custom,
      forType: (type: TxType) => [
        ...categoriesFor(type),
        ...custom.filter((c) => c.type === type).map(customCatMeta),
      ],
      resolve: (id: string) => resolveCatMeta(id, custom),
    }),
    [custom],
  );
}
