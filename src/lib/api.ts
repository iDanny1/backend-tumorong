// The staff UI is served by this backend. Same-origin requests keep credentials
// on the intended host and avoid cross-site cookie failures after deployment.
const API_URL = '';
let csrfToken = '';
let csrfPending: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfPending) {
    csrfPending = (async () => {
      const response = await fetch(API_URL + '/api/auth/csrf', { credentials: 'include', cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 401) window.dispatchEvent(new Event('admin-session-expired'));
        throw new ApiError('Chưa lấy được phiên xác thực. Vui lòng tải lại trang.', response.status);
      }
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    })().finally(() => { csrfPending = null; });
  }
  return csrfPending;
}

export async function apiFetch(endpoint: string, init: RequestInit = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-CSRF-Token', await getCsrfToken());
  const response = await fetch(API_URL + endpoint, { ...init, headers, credentials: 'include', cache: 'no-store' });
  if (endpoint === '/api/login' || endpoint === '/api/auth/logout' || response.status === 401) csrfToken = '';
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && endpoint !== '/api/login' && endpoint !== '/api/auth/me') {
      window.dispatchEvent(new Event('admin-session-expired'));
    }
    throw new ApiError(data.message || data.error || 'Chưa xử lý được yêu cầu.', response.status);
  }
  return response;
}

const jsonRequest = async (method: string, endpoint: string, data?: any) => {
  const response = await apiFetch(endpoint, { method,
    ...(data !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {}) });
  return response.json();
};
export const api = {
  get: (endpoint: string) => jsonRequest('GET', endpoint),
  post: (endpoint: string, data?: any) => jsonRequest('POST', endpoint, data),
  put: (endpoint: string, data: any) => jsonRequest('PUT', endpoint, data),
  patch: (endpoint: string, data: any) => jsonRequest('PATCH', endpoint, data),
  delete: (endpoint: string) => jsonRequest('DELETE', endpoint),
};
