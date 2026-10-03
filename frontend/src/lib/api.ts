export const defaultApiUrl = import.meta.env.VITE_API_BASE_URL || "";
export const hostedDemo = import.meta.env.VITE_DEMO_MODE === "true";
export async function request(
  base: string,
  path: string,
  token: string | null,
  init: RequestInit = {},
) {
  if (!base)
    throw new Error(
      "Connect the processing service in Settings to use this feature.",
    );
  const response = await fetch(base.replace(/\/$/, "") + path, {
    ...init,
    headers: {
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status}).`,
    );
  return data;
}
