import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavigationGuard from "./NavigationGuard";

let pathname = "/play";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("@/app/i18n", () => ({
  useI18n: () => ({ locale: "en" }),
}));

describe("NavigationGuard", () => {
  beforeEach(() => {
    pathname = "/play";
    window.history.replaceState({}, "", "/play");
  });

  it("does not intercept browser navigation outside the simulated desktop", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const { container } = render(<NavigationGuard />);

    expect(container).toBeEmptyDOMElement();
    expect(pushState).not.toHaveBeenCalled();
  });

  it("guards the desktop without rendering a global safe-exit button", () => {
    pathname = "/desktop";
    window.history.replaceState({}, "", "/desktop");
    render(<NavigationGuard />);

    expect(screen.queryByRole("button", { name: /safe exit|saída segura/i })).not.toBeInTheDocument();
    expect(document.querySelector(".navigation-guard-notice")).toBeInTheDocument();
  });
});
