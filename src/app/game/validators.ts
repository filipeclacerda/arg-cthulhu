import { AttemptKind } from "./progress";

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[.,;:_/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface ValidationResult {
  accepted: boolean;
  nearMiss?: AttemptKind;
  matchedParts?: number;
}

export const validateLotQuery = (query: string): ValidationResult => {
  const value = normalize(query);
  const compact = value.replace(/\s/g, "");
  if (compact.includes("MSWHA1998114II")) {
    return { accepted: true, matchedParts: 4 };
  }
  const parts = [
    value.includes("WHATELEY"),
    value.includes("1998"),
    value.includes("114"),
    /\b(VOL|VOLUME)\b/.test(value) &&
      (/\b(II|2|TWO|DOIS)\b/.test(value) || compact.includes("VOLUMEII")),
  ];
  const matchedParts = parts.filter(Boolean).length;
  return {
    accepted: parts.every(Boolean),
    nearMiss: matchedParts >= 3 ? "catalog_partial" : undefined,
    matchedParts,
  };
};

export const validateCoastQuery = (query: string): boolean =>
  normalize(query).replace(/[^A-Z]/g, "").includes("YHANTHLEI");

export const validateLineageYear = (query: string): ValidationResult => {
  const value = normalize(query);
  if (value === "2026") return { accepted: true };
  const year = Number(value);
  return {
    accepted: false,
    nearMiss:
      Number.isInteger(year) && Math.abs(year - 2026) <= 2
        ? "lineage_near_year"
        : undefined,
  };
};

export type RunCommandError =
  | "missing_references"
  | "wrong_order"
  | "case_incomplete"
  | "seal_unavailable"
  | "invalid_command";

export interface RunCommandResult {
  accepted: boolean;
  error?: RunCommandError;
  references: string[];
}

export const validateIndexCommand = (
  command: string,
  collectedReferences: string[]
): RunCommandResult => {
  const normalized = command.trim().toUpperCase().replace(/\s+/g, " ");
  const match = normalized.match(/^INDEX\s+\/JOIN\s+(.+)$/);
  if (!match) return { accepted: false, error: "invalid_command", references: [] };

  const references = match[1]
    .split(/[\s-]+/)
    .map((reference) => reference.trim())
    .filter(Boolean);
  const required = ["E7", "A1", "C4", "B9"];
  const hasAllCollected = required.every((reference) =>
    collectedReferences.includes(reference)
  );
  if (!hasAllCollected) {
    return { accepted: false, error: "missing_references", references };
  }
  if (
    references.length === required.length &&
    required.every((reference) => references.includes(reference)) &&
    references.join("-") !== required.join("-")
  ) {
    return { accepted: false, error: "wrong_order", references };
  }
  if (references.join("-") !== required.join("-")) {
    return { accepted: false, error: "invalid_command", references };
  }
  return { accepted: true, references };
};
