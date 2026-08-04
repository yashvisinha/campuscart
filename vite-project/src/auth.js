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

/**
 * Returns the logged-in user's DAuth Roll Number (e.g., '106125040').
 * Extracted from rollNumber property or email prefix before '@nitt.edu'.
 */
export function getUserRollNumber() {
  try {
    const user = getUser();
    if (!user) return null;
    if (user.rollNumber) return String(user.rollNumber);
    if (user.email && user.email.includes('@')) {
      return user.email.split('@')[0];
    }
    if (user.id != null) return String(user.id);
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns the primary user identifier (Roll Number) to link listings, messages, orders, and wishlist.
 */
export function getUserId() {
  return getUserRollNumber();
}
