const AUTH_USER_KEY = 'dauth_user';
const AUTH_TOKEN_KEY = 'dauth_token';

export function isAuthenticated() {
  try {
    return Boolean(localStorage.getItem(AUTH_USER_KEY) && localStorage.getItem(AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
}

export function logout() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
