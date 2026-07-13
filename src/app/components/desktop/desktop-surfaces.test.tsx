import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CaseCodeCopyButton } from "./CaseCodeCopyButton";
import { DesktopIcon } from "./DesktopIcon";
import { FirstSessionOrientation } from "./FirstSessionOrientation";
import { Legacy1998Overlay } from "./Legacy1998Overlay";

describe("desktop interaction surfaces", () => {
  it("activates a desktop item with Enter and Space", () => {
    const onOpen = vi.fn();
    render(<DesktopIcon id="inbox" label="Inbox" icon="/icons/file.png" selected={false} attention={false} onSelect={vi.fn()} onOpen={onOpen} />);
    const icon = screen.getByRole("button", { name: "Inbox" });
    fireEvent.keyDown(icon, { key: "Enter" });
    fireEvent.keyDown(icon, { key: " " });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("persists dismissed first-session guidance", async () => {
    const open = vi.fn();
    render(<FirstSessionOrientation locale="pt-BR" open={open} />);
    const dismiss = screen.getAllByRole("button", { name: "Dispensar orientação" })[0];
    fireEvent.click(dismiss);
    expect(window.localStorage.getItem("miskatonic-onboarding-inbox")).toBe("dismissed");
    fireEvent.click(screen.getAllByRole("button", { name: "Abrir" })[0]);
    expect(open).toHaveBeenCalledWith("recent");
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  it("shows a visible error when clipboard access fails", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<CaseCodeCopyButton copy={async () => "CASE"} labels={{ copy: "Copy", copied: "Copied", failed: "Copy failed" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Copy failed");
  });

  it("keeps the legacy session modal accessible and escapable through its explicit return control", () => {
    const onExit = vi.fn();
    render(<Legacy1998Overlay locale="en" onExit={onExit} onOpenAccession={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Legacy 1998 session detected" })).toHaveAttribute("aria-modal", "true");
    fireEvent.click(screen.getByRole("button", { name: "RETURN_2026.EXE" }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
