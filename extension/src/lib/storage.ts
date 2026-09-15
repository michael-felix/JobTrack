export interface ExtensionConfig {
  apiBaseUrl: string;
  apiToken: string;
}

const STORAGE_KEY = "jobtrackConfig";

export async function getConfig(): Promise<ExtensionConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? null;
}

export async function setConfig(config: ExtensionConfig): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: config });
}

/** Origin pattern (e.g. "http://localhost:3000/*") used to request the
 * narrowest host permission needed for this specific backend URL, requested
 * on demand from the options page rather than declared broadly upfront. */
export function originPatternFor(apiBaseUrl: string): string {
  const url = new URL(apiBaseUrl);
  return `${url.protocol}//${url.host}/*`;
}
