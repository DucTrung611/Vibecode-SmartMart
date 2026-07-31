import { ApiEnvelope, ApiError, SuccessEnvelope } from "@/shared/types/api-envelope";
import { getAccessToken, setAccessToken } from "./auth-token";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:6060/v1";

interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Internal — prevents infinite retry loops after a refresh attempt. */
  _isRetry?: boolean;
}

// The only place `fetch` is called against the backend (mirrors the
// single-axios-instance convention, swapped to native fetch — see
// identity's context.md for why). Unwraps the {success,data,meta} envelope
// and throws ApiError on failure. On AUTH_TOKEN_EXPIRED it refreshes once
// and retries the original call.
export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const envelope = await apiFetchEnvelope<T>(path, init);
  return envelope.data;
}

// Same as apiFetch, but keeps `meta` (e.g. `meta.pagination` — API_SPEC.md
// §4) — needed by callers doing cursor-paginated listing (catalog), which
// apiFetch's unwrapped return value has nowhere to carry.
export async function apiFetchEnvelope<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<SuccessEnvelope<T>> {
  const { body, _isRetry, ...rest } = init;
  const token = getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (e.g. DELETE /addresses/:id, POST /auth/logout) has no
  // body — calling response.json() on it throws "Unexpected end of JSON
  // input", which silently routed successful logouts into the error path.
  if (response.status === 204) {
    return { success: true, data: undefined as T, meta: { timestamp: "" } };
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (envelope.success) {
    return envelope;
  }

  if (envelope.error.code === "AUTH_TOKEN_EXPIRED" && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchEnvelope<T>(path, { ...init, _isRetry: true });
    }
  }

  if (envelope.error.code === "AUTH_SESSION_INVALID") {
    setAccessToken(null);
  }

  throw new ApiError(
    envelope.error.code,
    envelope.error.message,
    envelope.error.details,
    response.status,
  );
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const envelope = (await response.json()) as ApiEnvelope<{
      accessToken: string;
    }>;
    if (envelope.success) {
      setAccessToken(envelope.data.accessToken);
      return true;
    }
    setAccessToken(null);
    return false;
  } catch {
    setAccessToken(null);
    return false;
  }
}
