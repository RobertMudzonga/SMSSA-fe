// Default to relative `/api` so Vite dev proxy routes to local backend during development.
// In production, if `VITE_API_BASE` isn't set, default to the Render backend.
// In production default to the Render backend domain WITHOUT `/api` suffix (it will be added by fetch calls).
// Dev uses relative `/api` so Vite proxy still works.
export const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.PROD ? 'https://smssa-backend.onrender.com' : '/api');

export function apiUrl(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, options);
}

// Patch global `fetch` in the browser so existing code that calls
// `fetch('/api/...')` will be forwarded to `API_BASE` when
// `API_BASE` is an absolute URL (production). We avoid patching when
// `API_BASE` is a relative path (e.g. '/api') to preserve dev proxy behavior.
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  try {
    const isAbsolute = /^https?:\/\//i.test(API_BASE);
    if (isAbsolute) {
      const originalFetch = window.fetch.bind(window);
      // eslint-disable-next-line @typescript-eslint/ban-types
      window.fetch = (input: RequestInfo, init?: RequestInit) => {
        try {
          if (typeof input === 'string') {
            // Rewrite any path starting with / to use API_BASE
            if (input.startsWith('/') && !input.startsWith('//')) {
              const base = API_BASE.replace(/\/$/, '');
              input = base + input;
            }
          } else if (input instanceof Request) {
            const reqUrl = input.url || '';
            // Rewrite any path starting with / to use API_BASE
            if (reqUrl.startsWith('/') && !reqUrl.startsWith('//')) {
              const base = API_BASE.replace(/\/$/, '');
              input = new Request(base + reqUrl, input);
            }
          }
        } catch (e) {
          // fallback to original input if anything goes wrong
        }
        return originalFetch(input, init as any);
      };
    }
  } catch (e) {
    // do not crash if patching fails
    // console.warn('Failed to patch global fetch for API_BASE rewrite', e);
  }
}
