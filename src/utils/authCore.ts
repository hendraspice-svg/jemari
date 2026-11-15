import crypto from 'node:crypto';
import type {
  AuthUser,
  CreateUserInput,
  LoginCredentials,
  StoredUser,
  UpdateUserInput,
  UserRole,
} from '../types/auth.ts';

export interface SessionPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthOutcome {
  ok: boolean;
  status: number;
  error?: string;
  user?: AuthUser;
}

export interface MutationOutcome<T> {
  ok: boolean;
  status: number;
  error?: string;
  users?: StoredUser[];
  data?: T;
}

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (!username) {
    return 'Username wajib diisi.';
  }
  if (username.length < 3 || username.length > 32) {
    return 'Username harus terdiri dari 3 hingga 32 karakter.';
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return 'Username hanya boleh berisi huruf kecil, angka, titik (.), garis bawah (_), atau tanda hubung (-).';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'Password minimal harus terdiri dari 6 karakter.';
  }
  if (password.length > 128) {
    return 'Password maksimal 128 karakter.';
  }
  return null;
}

export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  if (!salt || !originalHex) return false;
  try {
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    const originalBuf = Buffer.from(originalHex, 'hex');
    if (derivedBuf.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, originalBuf);
  } catch {
    return false;
  }
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function createSessionToken(
  user: Pick<AuthUser, 'id' | 'username' | 'role'>,
  secret: string,
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS,
  nowMs: number = Date.now()
): string {
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + ttlSeconds;
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      iat,
      exp,
    } satisfies SessionPayload)
  );
  const signingInput = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${sig}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): SessionPayload | null {
  if (!token || !secret) return null;
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  const [header, payload, signature] = segments;
  if (!header || !payload || !signature) return null;

  const signingInput = `${header}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as SessionPayload;
    if (
      !parsed ||
      typeof parsed.sub !== 'string' ||
      typeof parsed.username !== 'string' ||
      (parsed.role !== 'operator' && parsed.role !== 'pengguna') ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }
    const nowSec = Math.floor(nowMs / 1000);
    if (parsed.exp <= nowSec) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toPublicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    unit: user.unit,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function authenticateUser(
  users: StoredUser[],
  credentials: LoginCredentials
): AuthOutcome {
  const username = normalizeUsername(credentials.username || '');
  const password = credentials.password || '';

  if (!username || !password) {
    return {
      ok: false,
      status: 400,
      error: 'Username dan password wajib diisi.',
    };
  }

  const found = users.find((u) => normalizeUsername(u.username) === username);
  if (!found || !verifyPassword(password, found.passwordHash)) {
    return {
      ok: false,
      status: 401,
      error: 'Username atau password salah. Silakan periksa kembali kredensial Anda.',
    };
  }

  if (!found.active) {
    return {
      ok: false,
      status: 403,
      error: 'Akun ini sedang dinonaktifkan oleh Operator. Hubungi Operator IGD.',
    };
  }

  if (credentials.expectedRole && found.role !== credentials.expectedRole) {
    const targetTab = found.role === 'operator' ? 'Login Operator' : 'Login Pengguna';
    const currentRoleLabel = found.role === 'operator' ? 'Operator' : 'Pengguna';
    return {
      ok: false,
      status: 403,
      error: `Akun "${found.username}" terdaftar sebagai ${currentRoleLabel}. Silakan pilih tab ${targetTab}.`,
    };
  }

  return {
    ok: true,
    status: 200,
    user: toPublicUser(found),
  };
}

function countActiveOperators(users: StoredUser[]): number {
  return users.filter((u) => u.role === 'operator' && u.active).length;
}

export function createUserAccount(
  users: StoredUser[],
  input: CreateUserInput,
  nowIso: string = new Date().toISOString()
): MutationOutcome<AuthUser> {
  const usernameError = validateUsername(input.username || '');
  if (usernameError) {
    return { ok: false, status: 400, error: usernameError };
  }

  const passwordError = validatePassword(input.password || '');
  if (passwordError) {
    return { ok: false, status: 400, error: passwordError };
  }

  const fullName = (input.fullName || '').trim();
  if (fullName.length < 2) {
    return { ok: false, status: 400, error: 'Nama lengkap wajib diisi (minimal 2 karakter).' };
  }

  if (input.role !== 'operator' && input.role !== 'pengguna') {
    return { ok: false, status: 400, error: 'Peran akun harus Operator atau Pengguna.' };
  }

  const normalized = normalizeUsername(input.username);
  if (users.some((u) => normalizeUsername(u.username) === normalized)) {
    return { ok: false, status: 409, error: `Username "${normalized}" sudah digunakan.` };
  }

  const newUser: StoredUser = {
    id: `usr-${crypto.randomUUID().slice(0, 8)}`,
    username: normalized,
    fullName,
    role: input.role,
    unit: (input.unit || '').trim() || (input.role === 'operator' ? 'IGD & Rekam Medis' : 'Unit Pelayanan'),
    active: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    passwordHash: hashPassword(input.password),
  };

  return {
    ok: true,
    status: 201,
    users: [...users, newUser],
    data: toPublicUser(newUser),
  };
}

export function updateUserAccount(
  users: StoredUser[],
  id: string,
  patch: UpdateUserInput,
  nowIso: string = new Date().toISOString()
): MutationOutcome<AuthUser> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    return { ok: false, status: 404, error: 'Akun pengguna tidak ditemukan.' };
  }

  const target = users[idx];

  if (patch.fullName !== undefined && patch.fullName.trim().length < 2) {
    return { ok: false, status: 400, error: 'Nama lengkap minimal 2 karakter.' };
  }

  if (patch.password !== undefined && patch.password !== '') {
    const pwError = validatePassword(patch.password);
    if (pwError) {
      return { ok: false, status: 400, error: pwError };
    }
  }

  if (patch.role !== undefined && patch.role !== 'operator' && patch.role !== 'pengguna') {
    return { ok: false, status: 400, error: 'Peran akun tidak valid.' };
  }

  const nextRole = patch.role ?? target.role;
  const nextActive = patch.active ?? target.active;
  const wasActiveOperator = target.role === 'operator' && target.active;
  const remainsActiveOperator = nextRole === 'operator' && nextActive;

  if (wasActiveOperator && !remainsActiveOperator && countActiveOperators(users) <= 1) {
    return {
      ok: false,
      status: 400,
      error: 'Minimal harus ada satu akun Operator yang aktif dalam sistem.',
    };
  }

  const updated: StoredUser = {
    ...target,
    fullName: patch.fullName !== undefined ? patch.fullName.trim() : target.fullName,
    role: nextRole,
    unit: patch.unit !== undefined ? patch.unit.trim() : target.unit,
    active: nextActive,
    passwordHash:
      patch.password && patch.password.length > 0
        ? hashPassword(patch.password)
        : target.passwordHash,
    updatedAt: nowIso,
  };

  const nextUsers = [...users];
  nextUsers[idx] = updated;

  return {
    ok: true,
    status: 200,
    users: nextUsers,
    data: toPublicUser(updated),
  };
}

export function deleteUserAccount(
  users: StoredUser[],
  id: string,
  actingUserId: string
): MutationOutcome<{ deletedId: string }> {
  const target = users.find((u) => u.id === id);
  if (!target) {
    return { ok: false, status: 404, error: 'Akun pengguna tidak ditemukan.' };
  }

  if (target.id === actingUserId) {
    return { ok: false, status: 400, error: 'Tidak dapat menghapus akun yang sedang digunakan.' };
  }

  if (target.role === 'operator' && target.active && countActiveOperators(users) <= 1) {
    return {
      ok: false,
      status: 400,
      error: 'Minimal harus ada satu akun Operator yang aktif dalam sistem.',
    };
  }

  return {
    ok: true,
    status: 200,
    users: users.filter((u) => u.id !== id),
    data: { deletedId: id },
  };
}

export function createDefaultSeedUsers(nowIso: string = '2026-11-15T00:00:00.000Z'): StoredUser[] {
  return [
    {
      id: 'usr-operator-1',
      username: 'operator',
      fullName: 'Operator Jaga IGD',
      role: 'operator',
      unit: 'IGD & Rekam Medis',
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword('operator123'),
    },
    {
      id: 'usr-operator-2',
      username: 'admin_igd',
      fullName: 'Koordinator IGD & Ranap',
      role: 'operator',
      unit: 'Koordinator Ruangan IGD',
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword('wanareja2026'),
    },
    {
      id: 'usr-pengguna-1',
      username: 'pengguna',
      fullName: 'Petugas Pengguna Layanan',
      role: 'pengguna',
      unit: 'Pelayanan Rawat Inap',
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword('pengguna123'),
    },
    {
      id: 'usr-pengguna-2',
      username: 'kepala_pkm',
      fullName: 'Kepala Puskesmas Wanareja II',
      role: 'pengguna',
      unit: 'Pimpinan Puskesmas',
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: hashPassword('kapus2026'),
    },
  ];
}
