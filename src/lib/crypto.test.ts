import { beforeAll, describe, expect, it } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

beforeAll(() => {
  // 32 random bytes, base64-encoded — same shape real deployments use.
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

describe("encrypt/decrypt", () => {
  it("round-trips a plaintext string", () => {
    const plaintext = "1//09-a-fake-refresh-token";
    const encrypted = decrypt(encrypt(plaintext));
    expect(encrypted).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext each time", () => {
    const plaintext = "same-secret";
    expect(encrypt(plaintext)).not.toBe(encrypt(plaintext));
  });

  it("throws on a tampered payload instead of returning garbage", () => {
    const tampered = encrypt("secret").slice(0, -4) + "abcd";
    expect(() => decrypt(tampered)).toThrow();
  });
});
