import type {
  AnalyzeResponse,
  DashChatMessage,
  DashChatResponse,
  MasterParsedPayload,
  TransactionLedgerEntry,
} from "@/lib/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readApiError(response: Response): Promise<string> {
  const fallbackMessage = `Request failed with status ${response.status}`;

  try {
    const text = await response.text();

    if (!text.trim()) {
      return fallbackMessage;
    }

    try {
      const body: unknown = JSON.parse(text);

      if (typeof body === "string") {
        return body;
      }

      if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;

        if (typeof record.detail === "string") {
          return record.detail;
        }

        if (typeof record.message === "string") {
          return record.message;
        }
      }
    } catch {
      return text;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await readApiError(response);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function ingestPDF(file: File): Promise<MasterParsedPayload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/ingest`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<MasterParsedPayload>(response);
}

export async function analyzeSessions(
  sessions: MasterParsedPayload[],
  transactions: TransactionLedgerEntry[] = []
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessions, transactions }),
  });

  return parseJsonResponse<AnalyzeResponse>(response);
}

export async function chatWithDash(
  session: MasterParsedPayload,
  messages: DashChatMessage[]
): Promise<DashChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze/dash-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ session, messages }),
  });

  return parseJsonResponse<DashChatResponse>(response);
}
