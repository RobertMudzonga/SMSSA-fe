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
  
  // Add user email from localStorage to headers for authorization checks
  const headers = new Headers(options?.headers || {});
  try {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail && !headers.has('x-user-email')) {
      headers.set('x-user-email', userEmail);
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  const fetchOptions: RequestInit = {
    ...options,
    headers
  };
  
  return fetch(url, fetchOptions);
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
          // Add user email header for authorization checks
          const headers = new Headers(init?.headers || {});
          try {
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail && !headers.has('x-user-email')) {
              headers.set('x-user-email', userEmail);
            }
          } catch (e) {
            // Ignore localStorage errors
          }
          
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
          
          return originalFetch(input, { ...init, headers } as any);
        } catch (e) {
          // fallback to original input if anything goes wrong
          return originalFetch(input, init as any);
        }
      };
    }
  } catch (e) {
    // do not crash if patching fails
    // console.warn('Failed to patch global fetch for API_BASE rewrite', e);
  }
}
