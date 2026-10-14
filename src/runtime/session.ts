import { datasets } from "../data/synthetic";
import { analyze, restoreSession, SESSION_KEY } from "../domain/review";
import type { Analysis, ReviewItem, Session } from "../domain/types";

export function loadSession(): Session {
  try {
    return restoreSession(
      localStorage.getItem(SESSION_KEY),
      datasets.flatMap((d) => d.items),
    );
  } catch {
    return {};
  }
}

export function saveSession(session: Session): boolean {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export async function runDemoAnalysis(item: ReviewItem): Promise<Analysis> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return analyze(item);
}

export function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
