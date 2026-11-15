import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  PhoneCall, 
  Activity, 
  Plus, 
  Volume2, 
  CheckCircle2, 
  Building2,
  CalendarDays,
  ShieldCheck,
  Users,
  LogOut,
  UserCheck
} from 'lucide-react';
import { PatientTrack } from '../types/index';
import type { AuthUser } from '../types/auth';
import bannerLogoImg from '../assets/images/jemari_banner_dash_ranap_1794748879019.jpg';

interface HeaderProps {
  patients: PatientTrack[];
  currentUser: AuthUser;
  canManageRecords: boolean;
  onOpenRegister: () => void;
  onPlayAnnouncement: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
  isAudioPlaying: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  patients,
  currentUser,
  canManageRecords,
  onOpenRegister,
  onPlayAnnouncement,
  onOpenUserManagement,
  onLogout,
  isAudioPlaying,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activePatients = patients.filter((p) => p.status !== 'selesai');
  const p1Patients = activePatients.filter((p) => p.triage === 'P1');

  return (
    <header className="bg-slate-900 border-b border-teal-900/60 text-white shadow-xl relative overflow-hidden">
      {/* Subtle background ambient pattern */}
      <div className="absolute inset-0 bg-radial from-teal-900/30 via-slate-900/80 to-slate-950 pointer-events-none" />
      
      {/* Top Utility Bar (Hotline & Live Clock) */}
      <div className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2">
            {/* Left: Organization & App Title */}
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase">
                JEMARI
              </span>
              <span className="text-teal-300 font-bold text-xs sm:text-sm uppercase">
                • PUSKESMAS WANAREJA II
              </span>
              <span className="text-slate-400 text-xs hidden 2xl:inline">
                • Dinas Kesehatan Kabupaten Cilacap
              </span>
            </div>

            {/* Right: Hotline, Live Clock, and Auth Account */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 text-xs">
              {/* Emergency Hotline */}
              <a
                href="tel:082326130206"
                className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-500/40 px-2 py-1 rounded-lg text-rose-200 hover:bg-rose-900/80 transition-colors whitespace-nowrap shrink-0"
                title="Hubungi Hotline IGD: 0823-2613-0206"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold text-white tracking-wide text-xs">0823-2613-0206</span>
              </a>

              {/* Live Clock & Date */}
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                <div className="flex items-center gap-1.5 text-teal-400 font-mono font-bold text-xs">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{currentTime || '08:00:00'} WIB</span>
                </div>
                <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-300 pl-2 border-l border-slate-700">
                  <CalendarDays className="w-3 h-3 text-slate-400" />
                  <span>{currentDate || 'Senin, 10 November 2026'}</span>
                </div>
              </div>

              {/* Authenticated User Account & Actions */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 whitespace-nowrap shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-200 whitespace-nowrap shrink-0">
                  {currentUser.role === 'operator' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white max-w-[140px] truncate">
                    {currentUser.fullName}
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span
                    className={`font-semibold ${
                      currentUser.role === 'operator' ? 'text-teal-300' : 'text-sky-300'
                    }`}
                  >
                    {currentUser.role === 'operator' ? 'Operator' : 'Pengguna'}
                  </span>
                </div>

                {currentUser.role === 'operator' && (
                  <button
                    type="button"
                    onClick={onOpenUserManagement}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Kelola Akun</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Keluar dari akun"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-700/70 text-slate-200 hover:text-rose-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Wide Panoramic Banner Section (Made Large & Elongated across Dashboard) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-1">
        <div className="w-full relative rounded-2xl overflow-hidden border border-teal-500/50 bg-slate-950 shadow-2xl shadow-teal-950/60 group">
          <img
            src={bannerLogoImg}
            alt="JEMARI - Jejak Elektronik Masuk dan Registrasi IGD - Rawat Inap - PUSKESMAS WANAREJA II"
            referrerPolicy="no-referrer"
            className="w-full aspect-[16/7.2] max-h-[460px] object-cover object-[center_18%] select-none block transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </div>
      </div>

      {/* Action Bar & Quick Emergency Stats */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1">
            {/* Active Patients */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium truncate">Pasien Aktif IGD</div>
                <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  {activePatients.length}
                  <span className="text-[11px] font-normal text-slate-400">orang</span>
                  {p1Patients.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-600 text-white animate-pulse">
                      {p1Patients.length} P1
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Service Standby Status (Replaces bed monitoring) */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium truncate">Layanan IGD</div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400 whitespace-nowrap">Siaga 24 Jam</span>
                </div>
              </div>
            </div>

            {/* Total Registered Today */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium truncate">Pasien Terdaftar</div>
                <div className="text-base sm:text-lg font-bold text-white flex items-center gap-1">
                  <span>245</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-700/40">Hari Ini</span>
                </div>
              </div>
            </div>

            {/* Facility Info: PUSKESMAS WANAREJA II */}
            <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium truncate">Puskesmas</div>
                <div className="text-[11px] sm:text-xs font-bold text-amber-300 leading-tight">
                  WANAREJA II
                  <span className="text-[10px] block font-normal text-slate-400 truncate">Kab. Cilacap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 md:pt-0">
            {/* Audio Announcement Simulator (Suara Laki-laki) */}
            <button
              onClick={onPlayAnnouncement}
              aria-label="Panggil Antrean IGD (Suara Laki-laki)"
              title="Panggilan Suara Laki-laki Antrean Pasien IGD"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isAudioPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Panggilan</span> Suara
            </button>

            {/* Quick Register Patient Button (Operator only) */}
            {canManageRecords ? (
              <button
                onClick={onOpenRegister}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-teal-900/30 border border-teal-400/40 hover:shadow-teal-800/50 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrasi Pasien (F2)</span>
              </button>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-sky-200 font-medium whitespace-nowrap shrink-0">
                Mode Pengguna (Baca Saja)
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
