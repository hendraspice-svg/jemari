import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { AuthUser, UserRole } from '../types/auth';
import {
  createUserApi,
  deleteUserApi,
  fetchUsersList,
  updateUserApi,
} from '../utils/authClient';

interface UserManagementModalProps {
  isOpen: boolean;
  currentUser: AuthUser;
  onClose: () => void;
  onNotify: (text: string, type?: 'success' | 'alert') => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onNotify,
}) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Create form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('pengguna');
  const [unit, setUnit] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Inline password reset state
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    setErrorMsg(null);
    fetchUsersList()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch((err) => {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat daftar akun.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesQuery =
        q === '' ||
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.unit.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, searchQuery, roleFilter]);

  const operatorCount = useMemo(
    () => users.filter((u) => u.role === 'operator' && u.active).length,
    [users]
  );
  const penggunaCount = useMemo(
    () => users.filter((u) => u.role === 'pengguna' && u.active).length,
    [users]
  );

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsCreating(true);
    try {
      const created = await createUserApi({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        role,
        unit: unit.trim(),
      });
      setUsers((prev) => [...prev, created]);
      setFullName('');
      setUsername('');
      setPassword('');
      setUnit('');
      setRole('pengguna');
      onNotify(`Akun "${created.username}" (${created.role === 'operator' ? 'Operator' : 'Pengguna'}) berhasil dibuat.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat akun baru.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (target: AuthUser) => {
    setBusyUserId(target.id);
    setErrorMsg(null);
    try {
      const updated = await updateUserApi(target.id, { active: !target.active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onNotify(
        `Akun "${updated.username}" ${updated.active ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengubah status akun.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (target: AuthUser, nextRole: UserRole) => {
    if (target.role === nextRole) return;
    setBusyUserId(target.id);
    setErrorMsg(null);
    try {
      const updated = await updateUserApi(target.id, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onNotify(
        `Peran "${updated.username}" diubah menjadi ${nextRole === 'operator' ? 'Operator' : 'Pengguna'}.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengubah peran akun.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSaveResetPassword = async (id: string) => {
    setBusyUserId(id);
    setErrorMsg(null);
    try {
      const updated = await updateUserApi(id, { password: newPassword });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setResetTargetId(null);
      setNewPassword('');
      onNotify(`Password untuk akun "${updated.username}" berhasil diperbarui.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui password.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (target: AuthUser) => {
    setBusyUserId(target.id);
    setErrorMsg(null);
    try {
      await deleteUserApi(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setConfirmDeleteId(null);
      onNotify(`Akun "${target.username}" berhasil dihapus.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus akun.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-mgmt-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <h2 id="user-mgmt-title" className="text-base sm:text-lg font-bold">
              Manajemen Akun Operator &amp; Pengguna
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-0.5 tabular-nums">
              <span>Total: {users.length} akun</span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-300">Operator Aktif: {operatorCount}</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300">Pengguna Aktif: {penggunaCount}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup manajemen akun"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="space-y-3 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserPlus className="w-4 h-4 text-teal-700" />
              <h3>Tambah Akun Baru</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label htmlFor="new-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="new-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: dr. Siti Aminah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="new-username" className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  id="new-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: bidan_tarisi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min. 6 karakter)
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label htmlFor="new-role" className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran Akun
                </label>
                <select
                  id="new-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="pengguna">Pengguna (Baca Saja)</option>
                  <option value="operator">Operator (Akses Penuh)</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-unit" className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Bagian
                </label>
                <input
                  id="new-unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Contoh: Poli Umum / IGD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isCreating ? 'Menyimpan...' : 'Buat Akun'}</span>
              </button>
            </div>
          </form>

          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, username, atau unit..."
                  aria-label="Cari akun pengguna"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                {(['all', 'operator', 'pengguna'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRoleFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      roleFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' ? 'Semua' : tab === 'operator' ? 'Operator' : 'Pengguna'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accounts Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="px-3 py-2.5">Nama &amp; Unit</th>
                    <th className="px-3 py-2.5">Username</th>
                    <th className="px-3 py-2.5">Peran</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Memuat daftar akun...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Tidak ada akun yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser.id;
                      const isBusy = busyUserId === u.id;
                      return (
                        <React.Fragment key={u.id}>
                          <tr className="hover:bg-slate-50/70">
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[11px] font-medium text-teal-700">
                                    (Akun Aktif Anda)
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px]">{u.unit || '-'}</div>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-800 font-medium">
                              {u.username}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {u.role === 'operator' ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                                )}
                                <select
                                  aria-label={`Ubah peran ${u.username}`}
                                  value={u.role}
                                  disabled={isBusy || isSelf}
                                  onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-800 disabled:opacity-60"
                                >
                                  <option value="operator">Operator</option>
                                  <option value="pengguna">Pengguna</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                disabled={isBusy || isSelf}
                                onClick={() => handleToggleActive(u)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${
                                  u.active
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {u.active ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setResetTargetId(resetTargetId === u.id ? null : u.id);
                                    setNewPassword('');
                                    setConfirmDeleteId(null);
                                  }}
                                  aria-label={`Reset password ${u.username}`}
                                  title="Ubah Password"
                                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Password</span>
                                </button>

                                {!isSelf && (
                                  confirmDeleteId === u.id ? (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleDeleteUser(u)}
                                        className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                      >
                                        Konfirmasi Hapus
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-600 text-xs cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => {
                                        setConfirmDeleteId(u.id);
                                        setResetTargetId(null);
                                      }}
                                      aria-label={`Hapus akun ${u.username}`}
                                      title="Hapus Akun"
                                      className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>

                          {resetTargetId === u.id && (
                            <tr className="bg-slate-50">
                              <td colSpan={5} className="px-3 py-2.5">
                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  <label
                                    htmlFor={`reset-pw-${u.id}`}
                                    className="text-xs font-semibold text-slate-700"
                                  >
                                    Password baru untuk <span className="font-mono">{u.username}</span>:
                                  </label>
                                  <input
                                    id={`reset-pw-${u.id}`}
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                                  />
                                  <button
                                    type="button"
                                    disabled={isBusy || newPassword.length < 6}
                                    onClick={() => handleSaveResetPassword(u.id)}
                                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Simpan Password</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetTargetId(null);
                                      setNewPassword('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium cursor-pointer whitespace-nowrap"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
