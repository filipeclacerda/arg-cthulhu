import { strFromU8, strToU8, zlibSync, unzlibSync } from "fflate";
import {
  CaseAnswer,
  CaseQuestionId,
  createInitialProgress,
  puzzleAct,
  ProgressStateV4,
  PuzzleId,
  PUZZLE_IDS,
} from "./progress";
import { CASE_STATEMENTS } from "./campaign";

const DB_NAME = "miskatonic-case-archive";
const DB_VERSION = 1;
const STORE = "saves";
const CURRENT_KEY = "current";
const CHECKPOINT_PREFIX = "checkpoint-";
const LEGACY_STORAGE_KEY = "arg-cthulhu-progress";
const FALLBACK_STORAGE_KEY = "arg-cthulhu-progress-v6";
const V5_FALLBACK_STORAGE_KEY = "arg-cthulhu-progress-v5";
const V4_FALLBACK_STORAGE_KEY = "arg-cthulhu-progress-v4";
const V3_FALLBACK_STORAGE_KEY = "arg-cthulhu-progress-v3";
const HEADER_STORAGE_KEY = "arg-cthulhu-progress-header";
const MAX_CHECKPOINTS = 3;

const normalizeCaseAnswers = (
  value: unknown
): Partial<Record<CaseQuestionId, CaseAnswer>> => {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, any>;
  const normalized: Partial<Record<CaseQuestionId, CaseAnswer>> = {};
  CASE_STATEMENTS.forEach((statement) => {
    const legacy = source[statement.id];
    if (!legacy || typeof legacy !== "object") return;
    if (legacy.slots && Array.isArray(legacy.lockedSlots)) {
      normalized[statement.id] = {
        slots: legacy.slots,
        lockedSlots: legacy.lockedSlots,
        evidenceIds: Array.isArray(legacy.evidenceIds)
          ? legacy.evidenceIds
          : [],
        attempts:
          typeof legacy.attempts === "number" ? legacy.attempts : 0,
        nearMisses:
          legacy.nearMisses && typeof legacy.nearMisses === "object"
            ? legacy.nearMisses
            : {},
        solvedAt:
          typeof legacy.solvedAt === "number" ? legacy.solvedAt : null,
      };
      return;
    }
    // v3/v4 and early v5 saves stored a selected radio answer. Existing
    // retained findings stay retained by deriving every correct slot.
    if (typeof legacy.answerId === "string") {
      normalized[statement.id] = {
        slots: Object.fromEntries(
          statement.slots.map((slot) => [slot.key, slot.correctTokenId])
        ),
        lockedSlots: statement.slots.map((slot) => slot.key),
        evidenceIds: Array.isArray(legacy.evidenceIds)
          ? legacy.evidenceIds
          : [],
        attempts:
          typeof legacy.attempts === "number" ? legacy.attempts : 1,
        nearMisses: {},
        solvedAt:
          typeof legacy.solvedAt === "number" ? legacy.solvedAt : Date.now(),
      };
    }
  });
  return normalized;
};

export interface SaveHeader {
  caseId: string;
  updatedAt: number;
  playerName: string | null;
  act: number;
}

export interface LoadResult {
  state: ProgressStateV4;
  source: "indexeddb" | "localstorage" | "new";
  recovered: boolean;
  persistenceAvailable: boolean;
}

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

const idbGet = async <T>(key: string): Promise<T | null> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    transaction.oncomplete = () => db.close();
  });
};

const idbPut = async (key: string, value: unknown): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(value, key);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
  });
};

const isProgressV5 = (value: unknown): value is ProgressStateV4 => {
  if (!value || typeof value !== "object") return false;
  const parsed = value as Partial<ProgressStateV4>;
  return (
    (parsed.version === 5 || parsed.version === 6) &&
    typeof parsed.caseId === "string" &&
    typeof parsed.updatedAt === "number" &&
    Boolean(parsed.puzzles) &&
    typeof parsed.puzzles === "object" &&
    PUZZLE_IDS.some((id) => Boolean(parsed.puzzles?.[id]))
  );
};

const markSolved = (
  state: ProgressStateV4,
  ids: PuzzleId[],
  timestamp: number
) => {
  ids.forEach((id, index) => {
    state.puzzles[id] = {
      ...state.puzzles[id],
      availableAt: state.puzzles[id].availableAt ?? timestamp,
      solvedAt: timestamp + index,
    };
  });
};

export const migrateProgress = (value: unknown): ProgressStateV4 | null => {
  if (isProgressV5(value)) {
    const initial = createInitialProgress(value.createdAt, value.caseId);
    return {
      ...initial,
      ...value,
      version: 6,
      collectedTokens: Array.isArray(value.collectedTokens)
        ? value.collectedTokens
        : [],
      caseAnswers: normalizeCaseAnswers(value.caseAnswers),
      puzzles: Object.fromEntries(
        PUZZLE_IDS.map((id) => [
          id,
          { ...initial.puzzles[id], ...value.puzzles[id] },
        ])
      ) as ProgressStateV4["puzzles"],
    };
  }
  if (!value || typeof value !== "object") return null;
  const legacy = value as Record<string, any>;
  if (legacy.version === 3 || legacy.version === 4) {
    const initial = createInitialProgress(
      typeof legacy.createdAt === "number" ? legacy.createdAt : Date.now(),
      typeof legacy.caseId === "string" ? legacy.caseId : undefined
    );
    const puzzles = Object.fromEntries(
      PUZZLE_IDS.map((id) => [
        id,
        {
          ...initial.puzzles[id],
          ...(legacy.puzzles?.[id] ?? {}),
          nearMisses: legacy.puzzles?.[id]?.nearMisses ?? {},
          hintHistory: legacy.puzzles?.[id]?.hintHistory ?? [],
          lastMeaningfulProgressAt:
            legacy.puzzles?.[id]?.lastMeaningfulProgressAt ??
            legacy.puzzles?.[id]?.availableAt ??
            null,
        },
      ])
    ) as ProgressStateV4["puzzles"];
    return {
      ...initial,
      ...legacy,
      version: 6,
      locale: legacy.locale === "pt-BR" ? "pt-BR" : "en",
      puzzles,
      insightsUnlocked: Array.isArray(legacy.insightsUnlocked)
        ? legacy.insightsUnlocked
        : [],
      theoryAttempts: Array.isArray(legacy.theoryAttempts)
        ? legacy.theoryAttempts
        : [],
      leadsUnlocked: Array.isArray(legacy.leadsUnlocked)
        ? legacy.leadsUnlocked
        : initial.leadsUnlocked,
      caseAnswers:
        normalizeCaseAnswers(legacy.caseAnswers),
      collectedTokens: Array.isArray(legacy.collectedTokens)
        ? legacy.collectedTokens
        : [],
      hypotheses:
        legacy.hypotheses && typeof legacy.hypotheses === "object"
          ? legacy.hypotheses
          : {},
      narrativeBeatsSeen: Array.isArray(legacy.narrativeBeatsSeen)
        ? legacy.narrativeBeatsSeen
        : [],
      worldReactionsSeen: Array.isArray(legacy.worldReactionsSeen)
        ? legacy.worldReactionsSeen
        : [],
      playerChoices: Array.isArray(legacy.playerChoices)
        ? legacy.playerChoices
        : [],
      optionalDiscoveries: Array.isArray(legacy.optionalDiscoveries)
        ? legacy.optionalDiscoveries
        : [],
      assetVariantsSeen: Array.isArray(legacy.assetVariantsSeen)
        ? legacy.assetVariantsSeen
        : [],
    };
  }
  if (legacy.version !== 1 && legacy.version !== 2) return null;

  const now = Date.now();
  const migrated = createInitialProgress(
    typeof legacy.firstSeenAt === "number" ? legacy.firstSeenAt : now
  );
  migrated.playerName =
    typeof legacy.playerName === "string" ? legacy.playerName : null;
  migrated.readFileIds = Array.isArray(legacy.readFileIds)
    ? legacy.readFileIds.filter((id: unknown): id is string => typeof id === "string")
    : [];
  migrated.readEmailIds = Array.isArray(legacy.readEmailIds)
    ? legacy.readEmailIds.filter((id: unknown): id is string => typeof id === "string")
    : [];
  migrated.discoveredEvidenceIds = [...migrated.readFileIds];
  migrated.flags =
    legacy.flags && typeof legacy.flags === "object" ? { ...legacy.flags } : {};
  migrated.firstSeenAt =
    typeof legacy.firstSeenAt === "number" ? legacy.firstSeenAt : now;
  migrated.lastSeenAt =
    typeof legacy.lastSeenAt === "number" ? legacy.lastSeenAt : now;

  const stage = Number(legacy.corruptionStage ?? 0);
  if (legacy.flags?.cipher_1_solved || stage >= 1) {
    markSolved(migrated, ["lot_114", "palimpsest"], now);
  }
  if (legacy.flags?.cipher_2_solved || stage >= 2) {
    markSolved(
      migrated,
      ["lot_114", "palimpsest", "margin_cipher", "counting_audio", "lineage"],
      now
    );
  }
  if (stage >= 3) {
    markSolved(
      migrated,
      [
        "lot_114",
        "palimpsest",
        "margin_cipher",
        "counting_audio",
        "lineage",
        "future_log",
      ],
      now
    );
  }
  if (legacy.flags?.endgame_available || stage >= 4) {
    markSolved(migrated, [...PUZZLE_IDS], now);
    migrated.flags.endgame_available = true;
  }
  if (legacy.flags?.ending_restore) migrated.ending = "restore";
  if (legacy.flags?.ending_shutdown) migrated.ending = "shutdown";
  if (legacy.flags?.ending_seal) migrated.ending = "seal";
  if (legacy.flags?.ending_leave_blank) migrated.ending = "leave_blank";
  if (legacy.flags?.ending_archive_self) migrated.ending = "archive_self";
  migrated.corruptionStage = Math.min(4, Math.max(0, stage));
  migrated.revision = 1;
  migrated.updatedAt = now;
  return migrated;
};

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readLocalFallback = (): ProgressStateV4 | null =>
  migrateProgress(
    safeParse(localStorage.getItem(FALLBACK_STORAGE_KEY)) ??
      safeParse(localStorage.getItem(V5_FALLBACK_STORAGE_KEY)) ??
      safeParse(localStorage.getItem(V4_FALLBACK_STORAGE_KEY)) ??
      safeParse(localStorage.getItem(V3_FALLBACK_STORAGE_KEY)) ??
      safeParse(localStorage.getItem(LEGACY_STORAGE_KEY))
  );

export const hasSaveHeader = (): SaveHeader | null => {
  try {
    return safeParse(localStorage.getItem(HEADER_STORAGE_KEY)) as SaveHeader | null;
  } catch {
    return null;
  }
};

export const loadProgress = async (): Promise<LoadResult> => {
  let persistenceAvailable = true;
  try {
    const current = migrateProgress(await idbGet<unknown>(CURRENT_KEY));
    if (current) {
      return {
        state: current,
        source: "indexeddb",
        recovered: false,
        persistenceAvailable,
      };
    }
    for (let i = 0; i < MAX_CHECKPOINTS; i += 1) {
      const checkpoint = migrateProgress(
        await idbGet<unknown>(`${CHECKPOINT_PREFIX}${i}`)
      );
      if (checkpoint) {
        return {
          state: checkpoint,
          source: "indexeddb",
          recovered: true,
          persistenceAvailable,
        };
      }
    }
  } catch {
    persistenceAvailable = false;
  }

  try {
    const fallback = readLocalFallback();
    if (fallback) {
      return {
        state: fallback,
        source: "localstorage",
        recovered: false,
        persistenceAvailable,
      };
    }
  } catch {
    persistenceAvailable = false;
  }

  return {
    state: createInitialProgress(),
    source: "new",
    recovered: false,
    persistenceAvailable,
  };
};

const writeHeader = (state: ProgressStateV4) => {
  const header: SaveHeader = {
    caseId: state.caseId,
    updatedAt: state.updatedAt,
    playerName: state.playerName,
    act: puzzleAct(state),
  };
  localStorage.setItem(HEADER_STORAGE_KEY, JSON.stringify(header));
};

export const persistProgress = async (
  state: ProgressStateV4,
  checkpoint = false
): Promise<"indexeddb" | "localstorage"> => {
  try {
    if (checkpoint) {
      for (let i = MAX_CHECKPOINTS - 1; i > 0; i -= 1) {
        const previous = await idbGet<unknown>(`${CHECKPOINT_PREFIX}${i - 1}`);
        if (previous) await idbPut(`${CHECKPOINT_PREFIX}${i}`, previous);
      }
      const current = await idbGet<unknown>(CURRENT_KEY);
      if (current) await idbPut(`${CHECKPOINT_PREFIX}0`, current);
    }
    await idbPut(CURRENT_KEY, state);
    writeHeader(state);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(state));
    return "indexeddb";
  } catch {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(state));
    writeHeader(state);
    return "localstorage";
  }
};

export const clearCurrentProgress = async (): Promise<void> => {
  try {
    const current = await idbGet<unknown>(CURRENT_KEY);
    if (current) await idbPut(`${CHECKPOINT_PREFIX}0`, current);
    await idbPut(CURRENT_KEY, null);
  } catch {
    // IndexedDB may be unavailable; the local fallback is cleared below.
  }
  localStorage.removeItem(FALLBACK_STORAGE_KEY);
  localStorage.removeItem(V5_FALLBACK_STORAGE_KEY);
  localStorage.removeItem(V4_FALLBACK_STORAGE_KEY);
  localStorage.removeItem(V3_FALLBACK_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(HEADER_STORAGE_KEY);
};

const canonicalize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + 0x8000))
    );
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const checksum = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);
  return Array.from(new Uint8Array(digest).slice(0, 6))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

export const exportCaseCode = async (
  state: ProgressStateV4
): Promise<string> => {
  const compressed = zlibSync(strToU8(canonicalize(state)), { level: 9 });
  return `MISK6.${toBase64Url(compressed)}.${await checksum(compressed)}`;
};

export const importCaseCode = async (
  code: string
): Promise<ProgressStateV4> => {
  const [prefix, payload, expectedChecksum] = code.trim().split(".");
  if (!["MISK3", "MISK4", "MISK5", "MISK6"].includes(prefix) || !payload || !expectedChecksum) {
    throw new Error("This is not a MISK3, MISK4, MISK5 or MISK6 case code.");
  }
  const compressed = fromBase64Url(payload);
  const actualChecksum = await checksum(compressed);
  if (actualChecksum !== expectedChecksum.toUpperCase()) {
    throw new Error("Case code checksum does not match.");
  }
  const parsed = JSON.parse(strFromU8(unzlibSync(compressed)));
  const migrated = migrateProgress(parsed);
  if (!migrated) throw new Error("The case data is not compatible.");
  return {
    ...migrated,
    revision: migrated.revision + 1,
    updatedAt: Date.now(),
  };
};
