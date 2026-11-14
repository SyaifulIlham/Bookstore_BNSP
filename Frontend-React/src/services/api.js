const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, { token, body, headers = {}, ...options } = {}) {
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isFormData) requestHeaders['Content-Type'] = 'application/json';

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });
  const payload = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : '';
    throw new ApiError(
      validationMessage || payload?.message || `Permintaan gagal (HTTP ${response.status}).`,
      response.status,
    );
  }

  return payload;
}
