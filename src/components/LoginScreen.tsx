import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  PhoneCall,
  Building2,
} from 'lucide-react';
import type { AuthUser, UserRole } from '../types/auth';
import { loginWithCredentials } from '../utils/authClient';
import bannerLogoImg from '../assets/images/jemari_banner_dash_ranap_1794748879019.jpg';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  const handleQuickFill = (role: UserRole, presetUsername: string, presetPassword: string) => {
    setSelectedRole(role);
    setUsername(presetUsername);
    setPassword(presetPassword);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Username dan password wajib diisi terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await loginWithCredentials({
        username: trimmedUser,
        password,
        expectedRole: selectedRole,
      });
      onLoginSuccess(user);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal masuk ke sistem. Periksa kembali akun Anda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between">
      {/* Top Institution Strip */}
      <header className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>JEMARI IGD RANAP</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-teal-300 font-bold">PUSKESMAS WANAREJA II</span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-500">·</span>
            <span className="hidden sm:inline text-slate-400 font-normal">
              Dinas Kesehatan Kabupaten Cilacap
            </span>
          </div>
          <a
            href="tel:082326130206"
            className="flex items-center gap-1.5 text-rose-200 hover:text-white font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span>Hotline IGD: 0823-2613-0206</span>
          </a>
        </div>
      </header>

      {/* Main Centered Auth Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel: Institutional Identity & Role Matrix */}
          <section className="lg:col-span-7 bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-6 sm:p-7">
            <div className="space-y-5">
              <div className="rounded-xl overflow-hidden border border-teal-500/40 bg-slate-950">
                <img
                  src={bannerLogoImg}
                  alt="JEMARI - Jejak Elektronik Masuk dan Registrasi IGD - Rawat Inap - PUSKESMAS WANAREJA II"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[16/6.2] object-cover object-[center_18%] block select-none"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-teal-300 tracking-wide">
                  Sistem Informasi Registrasi &amp; Rekapitulasi Pasien
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                  Portal Autentikasi Operator &amp; Pengguna
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Silakan masuk menggunakan username dan password resmi sesuai peran akses Anda di
                  IGD &amp; Rawat Inap PUSKESMAS WANAREJA II.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Akses Operator</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Input pasien baru (F2), edit dan hapus register IGD, lengkapi data rawat inap,
                  serta kelola akun petugas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-300 font-semibold text-sm">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Akses Pengguna</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pantau dashboard rekap kunjungan, cari data buku register IGD &amp; rawat inap,
                  cetak, serta ekspor Excel.
                </p>
              </div>
            </div>
          </section>

          {/* Right Panel: Login Form */}
          <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="space-y-1 mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-500">
                  Pilih jenis login terlebih dahulu, lalu masukkan kredensial akun Anda.
                </p>
              </div>

              {/* Role Switcher Tabs */}
              <div
                role="tablist"
                aria-label="Pilih Jenis Akun Login"
                className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedRole === 'operator'}
                  onClick={() => handleRoleTabChange('operator')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedRole === 'operator'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Login Operator</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedRole === 'pengguna'}
                  onClick={() => handleRoleTabChange('pengguna')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedRole === 'pengguna'
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Login Pengguna</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {errorMessage && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={
                        selectedRole === 'operator'
                          ? 'Contoh: operator'
                          : 'Contoh: pengguna'
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${
                    selectedRole === 'operator'
                      ? 'bg-teal-700 hover:bg-teal-800'
                      : 'bg-sky-700 hover:bg-sky-800'
                  }`}
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting
                      ? 'Memverifikasi...'
                      : selectedRole === 'operator'
                      ? 'Masuk sebagai Operator'
                      : 'Masuk sebagai Pengguna'}
                  </span>
                </button>
              </form>
            </div>

            {/* Quick Credential Guide for Puskesmas Staff */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2.5">
              <p className="text-xs font-semibold text-slate-600">
                Akun Bawaan Sistem (Klik untuk mengisi form):
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="min-w-0">
                    <div className="font-semibold text-teal-800">Operator</div>
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      operator / operator123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('operator', 'operator', 'operator123')}
                    className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-teal-50 hover:border-teal-400 text-teal-800 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Isi Operator
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="min-w-0">
                    <div className="font-semibold text-sky-800">Pengguna</div>
                    <div className="font-mono text-[11px] text-slate-700 truncate">
                      pengguna / pengguna123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('pengguna', 'pengguna', 'pengguna123')}
                    className="px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-sky-50 hover:border-sky-400 text-sky-800 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Isi Pengguna
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-3.5 text-center text-xs">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 JEMARI IGD RANAP · PUSKESMAS WANAREJA II, Dinas Kesehatan Kabupaten Cilacap</p>
          <p>Sistem Registrasi Pasien IGD &amp; Rawat Inap</p>
        </div>
      </footer>
    </div>
  );
};
