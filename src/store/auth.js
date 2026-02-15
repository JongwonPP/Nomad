const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

let _user = null;
const _listeners = [];

function _decodePayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function _extractUser(token) {
  const payload = _decodePayload(token);
  if (!payload) return null;
  return {
    memberId: payload.memberId,
    email: payload.email,
    nickname: payload.nickname,
  };
}

function _notifyListeners() {
  _listeners.forEach((cb) => cb());
}

export function login(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  _user = _extractUser(accessToken);
  _notifyListeners();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  _user = null;
  _notifyListeners();
}

export function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (!_user) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      _user = _extractUser(token);
    }
  }
  return _user;
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function onAuthChange(callback) {
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}
