import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let locale: "en" | "pt-BR" = "en";
vi.mock("@/app/i18n", () => ({ useI18n: () => ({ locale }) }));
import LocaleDocumentSync from "./LocaleDocumentSync/LocaleDocumentSync";

describe("LocaleDocumentSync", () => {
  it("keeps the document language aligned with the active locale", async () => {
    const view = render(<LocaleDocumentSync />);
    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
    locale = "pt-BR";
    view.rerender(<LocaleDocumentSync />);
    await waitFor(() => expect(document.documentElement.lang).toBe("pt-BR"));
  });
});
