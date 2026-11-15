import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import type { AuthUser, StoredUser, UserRole } from './src/types/auth.ts';
import {
  authenticateUser,
  createDefaultSeedUsers,
  createSessionToken,
  createUserAccount,
  deleteUserAccount,
  toPublicUser,
  updateUserAccount,
  verifySessionToken,
} from './src/utils/authCore.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_FILE = path.join(DATA_DIR, 'session-secret.txt');
const SESSION_COOKIE_NAME = 'jemari_session';

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDataDir();
  if (fs.existsSync(SECRET_FILE)) {
    const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });
  return generated;
}

function loadUsers(): StoredUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const seeded = createDefaultSeedUsers();
    saveUsers(seeded);
    return seeded;
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as StoredUser[];
    }
  } catch {
    // Fallback to fresh seed if corrupted
  }
  const seeded = createDefaultSeedUsers();
  saveUsers(seeded);
  return seeded;
}

function saveUsers(users: StoredUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 1000 * 60 * 60 * 12,
  });
}

function clearSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
  });
}

interface AuthedRequest extends Request {
  currentUser?: AuthUser;
}

async function startServer(): Promise<void> {
  const sessionSecret = loadOrCreateSessionSecret();
  let usersCache: StoredUser[] = loadUsers();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Sesi login tidak ditemukan. Silakan masuk terlebih dahulu.' });
      return;
    }
    const payload = verifySessionToken(token, sessionSecret);
    if (!payload) {
      res.status(401).json({ error: 'Sesi login telah berakhir atau tidak valid.' });
      return;
    }
    const found = usersCache.find((u) => u.id === payload.sub);
    if (!found || !found.active) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'Akun tidak ditemukan atau sedang dinonaktifkan.' });
      return;
    }
    req.currentUser = toPublicUser(found);
    next();
  };

  const requireOperator = (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.currentUser || req.currentUser.role !== 'operator') {
      res.status(403).json({ error: 'Akses ditolak. Fitur ini hanya tersedia untuk Operator.' });
      return;
    }
    next();
  };

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const body = req.body as { username?: string; password?: string; expectedRole?: UserRole };
    const outcome = authenticateUser(usersCache, {
      username: typeof body?.username === 'string' ? body.username : '',
      password: typeof body?.password === 'string' ? body.password : '',
      expectedRole:
        body?.expectedRole === 'operator' || body?.expectedRole === 'pengguna'
          ? body.expectedRole
          : undefined,
    });

    if (!outcome.ok || !outcome.user) {
      res.status(outcome.status).json({ error: outcome.error || 'Gagal melakukan login.' });
      return;
    }

    const token = createSessionToken(outcome.user, sessionSecret);
    setSessionCookie(res, token);
    res.json({ user: outcome.user, token });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = extractToken(req);
    if (!token) {
      res.json({ user: null });
      return;
    }
    const payload = verifySessionToken(token, sessionSecret);
    if (!payload) {
      clearSessionCookie(res);
      res.json({ user: null });
      return;
    }
    const found = usersCache.find((u) => u.id === payload.sub);
    if (!found || !found.active) {
      clearSessionCookie(res);
      res.json({ user: null });
      return;
    }
    res.json({ user: toPublicUser(found) });
  });

  app.get('/api/users', requireAuth, requireOperator, (_req: AuthedRequest, res: Response) => {
    res.json({ users: usersCache.map(toPublicUser) });
  });

  app.post('/api/users', requireAuth, requireOperator, (req: AuthedRequest, res: Response) => {
    const body = req.body as {
      username?: string;
      password?: string;
      fullName?: string;
      role?: UserRole;
      unit?: string;
    };
    const result = createUserAccount(usersCache, {
      username: typeof body?.username === 'string' ? body.username : '',
      password: typeof body?.password === 'string' ? body.password : '',
      fullName: typeof body?.fullName === 'string' ? body.fullName : '',
      role: body?.role === 'operator' ? 'operator' : 'pengguna',
      unit: typeof body?.unit === 'string' ? body.unit : '',
    });

    if (!result.ok || !result.users || !result.data) {
      res.status(result.status).json({ error: result.error || 'Gagal membuat akun.' });
      return;
    }

    usersCache = result.users;
    saveUsers(usersCache);
    res.status(201).json({ user: result.data });
  });

  app.patch('/api/users/:id', requireAuth, requireOperator, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id || '');
    const body = req.body as {
      fullName?: string;
      role?: UserRole;
      unit?: string;
      active?: boolean;
      password?: string;
    };

    const result = updateUserAccount(usersCache, id, {
      fullName: typeof body?.fullName === 'string' ? body.fullName : undefined,
      role: body?.role === 'operator' || body?.role === 'pengguna' ? body.role : undefined,
      unit: typeof body?.unit === 'string' ? body.unit : undefined,
      active: typeof body?.active === 'boolean' ? body.active : undefined,
      password: typeof body?.password === 'string' ? body.password : undefined,
    });

    if (!result.ok || !result.users || !result.data) {
      res.status(result.status).json({ error: result.error || 'Gagal memperbarui akun.' });
      return;
    }

    usersCache = result.users;
    saveUsers(usersCache);
    res.json({ user: result.data });
  });

  app.delete('/api/users/:id', requireAuth, requireOperator, (req: AuthedRequest, res: Response) => {
    const id = String(req.params.id || '');
    const result = deleteUserAccount(usersCache, id, req.currentUser!.id);

    if (!result.ok || !result.users) {
      res.status(result.status).json({ error: result.error || 'Gagal menghapus akun.' });
      return;
    }

    usersCache = result.users;
    saveUsers(usersCache);
    res.json({ ok: true, deletedId: id });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JEMARI IGD RANAP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
