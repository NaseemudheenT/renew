import { describe, it, expect } from "vitest";
import { translate, EN } from "@/lib/i18n/messages";

describe("translate", () => {
  it("returns the localized string when available", () => {
    expect(translate("es", "date.today")).toBe("Hoy");
    expect(translate("ar", "nav.savings")).toBe("المدخرات");
  });
  it("falls back to English for a missing catalog key", () => {
    // de has no date.today wired? ensure fallback never returns the raw key.
    const out = translate("de", "common.retry");
    expect(out).toBe(EN["common.retry"]);
  });
  it("falls back to English for an unsupported language", () => {
    expect(translate("xx", "nav.budget")).toBe(EN["nav.budget"]);
  });
  it("resolves the base of a regioned tag (es-MX → es)", () => {
    expect(translate("es-MX", "date.tomorrow")).toBe("Mañana");
  });
  it("interpolates named placeholders", () => {
    expect(translate("en", "settings.data.import.done", { count: 5 })).toContain("5");
  });
  it("has the new-domain keys translated in es/fr", () => {
    expect(translate("es", "nav.accounts")).toBe("Cuentas");
    expect(translate("es", "accounts.transfer")).toBe("Transferir");
    expect(translate("fr", "nav.subscriptions")).toBe("Abonnements");
    expect(translate("fr", "subs.monthly")).toBe("Mensuel");
  });
});
