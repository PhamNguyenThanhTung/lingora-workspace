import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signInWithPassword, signUp, signOut } }))
}));

import { AuthService } from "@/features/auth/auth.service";

describe("AuthService", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signUp.mockReset();
    signOut.mockReset();
  });

  it("rejects malformed credentials before Supabase", async () => {
    await expect(new AuthService().login("bad", "short")).resolves.toEqual({ ok: false, code: "INVALID_INPUT" });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("maps invalid login without exposing provider details", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("provider detail") });
    await expect(new AuthService().login("learner@example.com", "password123")).resolves.toEqual({ ok: false, code: "INVALID_CREDENTIALS" });
  });

  it("registers and logs out through the server client", async () => {
    signUp.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
    const service = new AuthService();
    await expect(service.register("learner@example.com", "password123")).resolves.toEqual({ ok: true });
    await service.logout();
    expect(signUp).toHaveBeenCalledWith({ email: "learner@example.com", password: "password123" });
    expect(signOut).toHaveBeenCalledOnce();
  });
});
