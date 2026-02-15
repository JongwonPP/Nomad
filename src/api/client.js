import { getAccessToken, getRefreshToken, login, logout } from '../store/auth.js';
import { navigate } from '../router.js';

const BASE_URL = 'http://localhost:8080';

let _refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  login(data.accessToken, refreshToken);
  return data.accessToken;
}

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    if (data.errors) err.errors = data.errors;
    throw err;
  }
  return data;
}

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    try {
      if (!_refreshPromise) {
        _refreshPromise = refreshAccessToken();
      }
      const newToken = await _refreshPromise;
      _refreshPromise = null;

      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { ...options, headers });
      return handleResponse(retryRes);
    } catch {
      _refreshPromise = null;
      logout();
      navigate('/login');
      return null;
    }
  }

  return handleResponse(res);
}
