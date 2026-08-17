import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "@/components/auth/auth-form";
import { vi as messages } from "@/i18n/messages/vi";

vi.mock("@/features/auth/actions", () => ({
  loginAction: vi.fn(async () => ({ code: "INVALID_CREDENTIALS" })),
  registerAction: vi.fn(async () => ({}))
}));

describe("AuthForm", () => {
  it("has labeled inputs and a keyboard-reachable submit control", () => {
    render(createElement(AuthForm, { mode: "login", messages }));
    expect(screen.getByLabelText(messages.email)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(messages.password)).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: messages.login })).toBeEnabled();
  });

  it("submits through the server action boundary", async () => {
    const user = userEvent.setup();
    render(createElement(AuthForm, { mode: "login", messages }));
    await user.type(screen.getByLabelText(messages.email), "learner@example.com");
    await user.type(screen.getByLabelText(messages.password), "password123");
    await user.click(screen.getByRole("button", { name: messages.login }));
    expect(await screen.findByRole("alert")).toHaveTextContent(messages.invalidCredentials);
  });
});
