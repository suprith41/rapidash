import type {
  AssetHolding,
  MasterParsedPayload,
} from "@/lib/types";

const SESSION_KEY = "rapidash_session";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isConfidence(value: unknown): value is AssetHolding["confidence"] {
  return value === "high" || value === "low";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isExtractionMethod(
  value: unknown
): value is AssetHolding["extraction_method"] {
  return value === "deterministic" || value === "llm";
}

function isAssetHolding(value: unknown): value is AssetHolding {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.ticker_symbol) &&
    isString(value.isin) &&
    isNumber(value.quantity) &&
    isNumber(value.average_buy_price) &&
    isNumber(value.current_market_value) &&
    isNumber(value.source_page) &&
    isExtractionMethod(value.extraction_method) &&
    isConfidence(value.confidence)
  );
}

function isMasterParsedPayload(value: unknown): value is MasterParsedPayload {
  if (!isRecord(value)) {
    return false;
  }

  const { metadata, holdings, ledger_summary: ledgerSummary } = value;

  return (
    isRecord(metadata) &&
    isString(metadata.statement_timestamp) &&
    isString(metadata.origin_broker) &&
    Array.isArray(holdings) &&
    holdings.every(isAssetHolding) &&
    isRecord(ledgerSummary) &&
    isNumber(ledgerSummary.closing_cash_balance) &&
    isNumber(ledgerSummary.cumulative_platform_fees)
  );
}

export function saveSession(data: MasterParsedPayload): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // localStorage can be unavailable during SSR, private browsing, or quota errors.
  }
}

export function loadSession(): MasterParsedPayload | null {
  try {
    const serializedSession = window.localStorage.getItem(SESSION_KEY);

    if (!serializedSession) {
      return null;
    }

    const parsedSession: unknown = JSON.parse(serializedSession);

    return isMasterParsedPayload(parsedSession) ? parsedSession : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures so callers can use this from mixed SSR/client paths.
  }
}
