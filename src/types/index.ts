export type TranscriptRole = "user" | "ai";

export interface TranscriptItem {
  id: string;
  role: TranscriptRole;
  text: string;
  timestamp: number;
}