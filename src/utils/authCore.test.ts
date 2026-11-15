import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  createDefaultSeedUsers,
  createSessionToken,
  createUserAccount,
  deleteUserAccount,
  hashPassword,
  updateUserAccount,
  verifyPassword,
  verifySessionToken,
} from './authCore.ts';
import { canManageRecords, canManageUsers, canExportOrPrint, getRoleLabel } from './permissions.ts';

const SECRET = 'test-session-secret-key-jemari';

test('password hashing and verification rejects invalid passwords', () => {
  const hash = hashPassword('operator123');
  assert.equal(verifyPassword('operator123', hash), true);
  assert.equal(verifyPassword('wrongpass', hash), false);
  assert.equal(verifyPassword('operator123', 'malformed'), false);
});

test('session tokens sign, verify, and reject expired or tampered tokens', () => {
  const now = 1_760_000_000_000;
  const token = createSessionToken(
    { id: 'usr-1', username: 'operator', role: 'operator' },
    SECRET,
    3600,
    now
  );

  const verified = verifySessionToken(token, SECRET, now + 1000);
  assert.ok(verified);
  assert.equal(verified.sub, 'usr-1');
  assert.equal(verified.username, 'operator');
  assert.equal(verified.role, 'operator');

  // Expired
  assert.equal(verifySessionToken(token, SECRET, now + 3601 * 1000), null);

  // Tampered
  const parts = token.split('.');
  const tampered = `${parts[0]}.${parts[1]}.invalid_sig`;
  assert.equal(verifySessionToken(tampered, SECRET, now + 1000), null);
});

test('authenticateUser enforces password, active flag, and role matching', () => {
  const users = createDefaultSeedUsers();

  const opSuccess = authenticateUser(users, {
    username: 'Operator',
    password: 'operator123',
    expectedRole: 'operator',
  });
  assert.equal(opSuccess.ok, true);
  assert.equal(opSuccess.user?.role, 'operator');

  const userSuccess = authenticateUser(users, {
    username: 'pengguna',
    password: 'pengguna123',
    expectedRole: 'pengguna',
  });
  assert.equal(userSuccess.ok, true);
  assert.equal(userSuccess.user?.role, 'pengguna');

  const mismatch = authenticateUser(users, {
    username: 'operator',
    password: 'operator123',
    expectedRole: 'pengguna',
  });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.status, 403);
  assert.match(mismatch.error || '', /Login Operator/);

  const wrongPw = authenticateUser(users, {
    username: 'operator',
    password: 'salahpassword',
  });
  assert.equal(wrongPw.ok, false);
  assert.equal(wrongPw.status, 401);
});

test('user account CRUD prevents duplicate usernames and losing the last active operator', () => {
  let users = createDefaultSeedUsers();

  // Duplicate username check
  const dup = createUserAccount(users, {
    username: 'OPERATOR',
    password: 'secret123',
    fullName: 'Duplicate',
    role: 'operator',
  });
  assert.equal(dup.ok, false);
  assert.equal(dup.status, 409);

  // Create new Pengguna
  const created = createUserAccount(users, {
    username: 'bidan_desa',
    password: 'wanareja123',
    fullName: 'Bidan Desa Cilongkrang',
    role: 'pengguna',
    unit: 'Polindes Cilongkrang',
  });
  assert.equal(created.ok, true);
  assert.equal(created.data?.username, 'bidan_desa');
  users = created.users!;

  // Authenticate newly created Pengguna
  const loginNew = authenticateUser(users, {
    username: 'bidan_desa',
    password: 'wanareja123',
    expectedRole: 'pengguna',
  });
  assert.equal(loginNew.ok, true);

  // Deactivate second operator, then ensure last active operator cannot be deactivated or deleted
  const deactOp2 = updateUserAccount(users, 'usr-operator-2', { active: false });
  assert.equal(deactOp2.ok, true);
  users = deactOp2.users!;

  const deactLastOp = updateUserAccount(users, 'usr-operator-1', { active: false });
  assert.equal(deactLastOp.ok, false);
  assert.equal(deactLastOp.status, 400);

  const delSelf = deleteUserAccount(users, 'usr-operator-1', 'usr-operator-1');
  assert.equal(delSelf.ok, false);

  const delPengguna = deleteUserAccount(users, created.data!.id, 'usr-operator-1');
  assert.equal(delPengguna.ok, true);
});

test('RBAC permission helpers distinguish operator and pengguna', () => {
  assert.equal(canManageRecords('operator'), true);
  assert.equal(canManageUsers('operator'), true);
  assert.equal(canExportOrPrint('operator'), true);
  assert.equal(getRoleLabel('operator'), 'Operator');

  assert.equal(canManageRecords('pengguna'), false);
  assert.equal(canManageUsers('pengguna'), false);
  assert.equal(canExportOrPrint('pengguna'), true);
  assert.equal(getRoleLabel('pengguna'), 'Pengguna');
});
