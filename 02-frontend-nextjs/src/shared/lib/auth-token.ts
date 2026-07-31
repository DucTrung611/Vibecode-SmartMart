// Holds the access token outside the React tree so `api-client.ts`'s plain
// `fetch` wrapper can read/refresh it without depending on a component/hook.
// `SessionProvider` is the single writer — it calls `setAccessToken()`
// whenever its own React state changes, keeping the two in sync. This is
// not a second state store: nothing here triggers re-renders on its own.

let accessToken: string | null = null;
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
