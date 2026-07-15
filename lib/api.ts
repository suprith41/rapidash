import type {
  AnalyzeResponse,
  MasterParsedPayload,
  TransactionLedgerEntry,
} from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type DashMessage = { role: "user" | "assistant"; content: string };

export async function askDash(
  session: MasterParsedPayload,
  messages: DashMessage[]
): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/analyze/dash-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session, messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Dash returned ${response.status}`);
  }

  const data = (await response.json()) as { assistant_message: string };
  return data.assistant_message;
}

export async function ingestPDF(
  file: File
): Promise<MasterParsedPayload> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/api/ingest`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }
  
  return await response.json();
}

export async function analyzeSessions(
  sessions: MasterParsedPayload[],
  transactions: TransactionLedgerEntry[] = []
): Promise<AnalyzeResponse> {
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessions, transactions })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analyze failed: ${errorText}`);
  }
  
  return await response.json();
}
