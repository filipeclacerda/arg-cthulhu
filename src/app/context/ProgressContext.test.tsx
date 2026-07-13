import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressProvider, useProgress } from "./ProgressContext";

function LocaleProbe() {
  const { isHydrated, setLocale, state, isReadOnly } = useProgress();
  return <><output data-testid="hydrated">{String(isHydrated)}</output><output data-testid="readonly">{String(isReadOnly)}</output><output data-testid="locale">{state.locale}</output><button onClick={() => setLocale("pt-BR")}>PT</button></>;
}

describe("ProgressProvider persistence and write lock", () => {
  it("hydrates a writable fallback save and persists a locale change", async () => {
    window.localStorage.clear();
    render(<ProgressProvider><LocaleProbe /></ProgressProvider>);
    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));
    expect(screen.getByTestId("readonly")).toHaveTextContent("false");
    screen.getByRole("button", { name: "PT" }).click();
    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("pt-BR"));
    await waitFor(() => expect(window.localStorage.getItem("arg-cthulhu-progress-v7")).toContain('"locale":"pt-BR"'), { timeout: 1500 });
  });
});
