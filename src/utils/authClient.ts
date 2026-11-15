import type {
  AuthUser,
  CreateUserInput,
  LoginCredentials,
  LoginResponse,
  UpdateUserInput,
} from '../types/auth';

const TOKEN_STORAGE_KEY = 'jemari_auth_token_v1';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage unavailability
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const errMsg =
      payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Terjadi kesalahan pada server (${res.status}).`;
    throw new Error(errMsg);
  }

  return payload as T;
}

export async function loginWithCredentials(credentials: LoginCredentials): Promise<AuthUser> {
  const result = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setStoredToken(result.token);
  return result.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await apiFetch<{ user: AuthUser | null }>('/api/auth/me', {
      method: 'GET',
    });
    if (!result.user) {
      setStoredToken(null);
    }
    return result.user;
  } catch {
    setStoredToken(null);
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } catch {
    // Always clear client token
  } finally {
    setStoredToken(null);
  }
}

export async function fetchUsersList(): Promise<AuthUser[]> {
  const result = await apiFetch<{ users: AuthUser[] }>('/api/users', { method: 'GET' });
  return result.users;
}

export async function createUserApi(input: CreateUserInput): Promise<AuthUser> {
  const result = await apiFetch<{ user: AuthUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.user;
}

export async function updateUserApi(id: string, patch: UpdateUserInput): Promise<AuthUser> {
  const result = await apiFetch<{ user: AuthUser }>(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return result.user;
}

export async function deleteUserApi(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
