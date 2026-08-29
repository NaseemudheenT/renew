"use client";

import { createContext, useContext, type ReactNode } from "react";

type RequireReauth = (reason?: string) => Promise<boolean>;

/** App Lock was removed, so sensitive actions no longer need a second factor —
 *  this always passes through. Kept as a provider/hook so the many callers
 *  (`if (await requireReauth(...))`) stay unchanged. */
const PASS: RequireReauth = async () => true;

const ReauthContext = createContext<RequireReauth>(PASS);

export function useReauth(): RequireReauth {
  return useContext(ReauthContext);
}

export function ReauthProvider({ children }: { children: ReactNode }) {
  return <ReauthContext.Provider value={PASS}>{children}</ReauthContext.Provider>;
}
