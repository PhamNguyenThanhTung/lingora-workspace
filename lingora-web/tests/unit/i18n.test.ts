import { describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get })) }));

import { en } from "@/i18n/messages/en";
import { vi as viMessages } from "@/i18n/messages/vi";
import { getLocale, messagesFor } from "@/i18n/config";

describe("i18n", () => {
  it("keeps both catalogs structurally aligned", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(viMessages).sort());
  });

  it("defaults and falls back to Vietnamese", async () => {
    get.mockReturnValue({ value: "ja" });
    await expect(getLocale()).resolves.toBe("vi");
    expect(messagesFor("vi").login).toBe("Đăng nhập");
  });

  it("selects English only for the supported cookie", async () => {
    get.mockReturnValue({ value: "en" });
    await expect(getLocale()).resolves.toBe("en");
    expect(messagesFor("en").login).toBe("Sign in");
  });
});
