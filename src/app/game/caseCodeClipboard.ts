export type ClipboardResult = "copied" | "fallback" | "failed";

export const copyCaseCode = async (code: string): Promise<ClipboardResult> => {
  try {
    if (!navigator.clipboard?.writeText) return "fallback";
    await navigator.clipboard.writeText(code);
    return "copied";
  } catch {
    return "fallback";
  }
};
