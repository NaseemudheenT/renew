import { describe, it, expect } from "vitest";
import { makePasscodeRecord, verifyPasscode, isValidPasscode } from "./passcode";

describe("passcode", () => {
  it("verifies the correct code and rejects a wrong one", async () => {
    const rec = await makePasscodeRecord("1234", "pin", true);
    expect(await verifyPasscode("1234", rec)).toBe(true);
    expect(await verifyPasscode("0000", rec)).toBe(false);
    expect(await verifyPasscode("12345", rec)).toBe(false);
  });

  it("never stores the raw code, and salts each record differently", async () => {
    const a = await makePasscodeRecord("1234", "pin", false);
    const b = await makePasscodeRecord("1234", "pin", false);
    expect(a.hash).not.toContain("1234");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash); // different salt → different hash
  });

  it("verifies a text passphrase", async () => {
    const rec = await makePasscodeRecord("open sesame", "text", false);
    expect(await verifyPasscode("open sesame", rec)).toBe(true);
    expect(await verifyPasscode("Open Sesame", rec)).toBe(false);
  });

  it("validates format by kind", () => {
    expect(isValidPasscode("1234", "pin")).toBe(true);
    expect(isValidPasscode("12345678", "pin")).toBe(true);
    expect(isValidPasscode("123", "pin")).toBe(false);
    expect(isValidPasscode("12a4", "pin")).toBe(false);
    expect(isValidPasscode("word", "text")).toBe(true);
    expect(isValidPasscode("ab", "text")).toBe(false);
  });
});
