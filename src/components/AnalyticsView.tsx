import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  HeartPulse, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Award,
  ArrowUpRight
} from 'lucide-react';
import { PatientTrack } from '../types/index';

interface AnalyticsViewProps {
  patients: PatientTrack[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ patients }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    // Generate CSV string from patients
    const headers = ['No_Reg', 'No_RM', 'Nama', 'Usia', 'Gender', 'Desa', 'Triage', 'Keluhan', 'Status', 'Penjamin'];
    const rows = patients.map((p) => [
      p.registrationNumber,
      p.medicalRecordNumber,
      `"${p.fullName}"`,
      p.age,
      p.gender,
      `"${p.addressVillage}"`,
      p.triage,
      `"${p.chiefComplaint.replace(/"/g, '""')}"`,
      p.status,
      `"${p.insurance}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_JEMARI_IGD_RANAP_Wanareja_II_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Analytics Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Laporan Kinerja & Statistik IGD Puskesmas Wanareja II
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Sinkronisasi Rekam Jejak Pelayanan Masuk & Registrasi Pasien (JEMARI IGD RANAP)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{downloadSuccess ? 'Terekspor!' : 'Unduh CSV'}</span>
          </button>

          <button
            onClick={handlePrintSummary}
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Harian</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pasien Terdaftar</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">245</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% dibanding hari kemarin</span>
          </div>
        </div>

        {/* Response Time Target Compliance */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Kepatuhan Waktu Tanggap</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-700 font-mono">98.4%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Standar SPM: &ge; 95% (&lt; 5 mnt cito)
          </div>
        </div>

        {/* Average IGD Stay Duration */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rata-rata Waktu di IGD</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <HeartPulse className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">38.5 <span className="text-sm font-normal text-slate-500">menit</span></div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Optimal (Target Permenkes &lt; 120 mnt)
          </div>
        </div>

        {/* Quality Accreditation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Mutu Pelayanan IGD</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">Paripurna</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Terakreditasi LPA Kemenkes RI
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Distribution Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between">
            <span>Distribusi Triase Pelayanan Hari Ini</span>
            <span className="text-xs text-slate-500 font-mono">245 Kasus</span>
          </h3>

          <div className="space-y-3">
            {/* P1 Merah */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  P1 - Merah (Resusitasi / Gawat Darurat)
                </span>
                <span className="font-mono font-bold text-slate-900">12 Pasien (4.9%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 rounded-full" style={{ width: '4.9%' }} />
              </div>
            </div>

            {/* P2 Kuning */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  P2 - Kuning (Darurat Tidak Gawat / Urgent)
                </span>
                <span className="font-mono font-bold text-slate-900">79 Pasien (32.2%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '32.2%' }} />
              </div>
            </div>

            {/* P3 Hijau */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  P3 - Hijau (Tidak Gawat Tidak Darurat)
                </span>
                <span className="font-mono font-bold text-slate-900">153 Pasien (62.5%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62.5%' }} />
              </div>
            </div>

            {/* P0 Hitam */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  P0 - Hitam (Death on Arrival / DOA)
                </span>
                <span className="font-mono font-bold text-slate-900">1 Pasien (0.4%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: '0.4%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Insurance / Penjamin Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between">
            <span>Distribusi Penjamin Pasien</span>
            <span className="text-xs text-slate-500 font-mono">Cakupan UHC</span>
          </h3>

          <div className="space-y-3">
            {/* BPJS PBI */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-teal-800">BPJS Kesehatan PBI (Pemerintah)</span>
                <span className="font-mono font-bold text-slate-900">158 Pasien (64.5%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: '64.5%' }} />
              </div>
            </div>

            {/* BPJS Non-PBI */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-teal-800">BPJS Kesehatan Non-PBI / Mandiri</span>
                <span className="font-mono font-bold text-slate-900">54 Pasien (22.0%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: '22.0%' }} />
              </div>
            </div>

            {/* Umum / Mandiri */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Pasien Umum / Mandiri</span>
                <span className="font-mono font-bold text-slate-900">28 Pasien (11.5%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: '11.5%' }} />
              </div>
            </div>

            {/* Jampersal / SPM */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-purple-700">Jampersal & SPM Bansos</span>
                <span className="font-mono font-bold text-slate-900">5 Pasien (2.0%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '2.0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
