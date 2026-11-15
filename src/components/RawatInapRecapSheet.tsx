import React, { useMemo, useState } from 'react';
import {
  BedDouble,
  Printer,
  Calendar,
  BarChart3,
  Stethoscope,
  CheckCircle2,
  Activity,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from 'recharts';
import { DAFTAR_DIAGNOSA_MEDIS, PatientRecord, StatusPulangRanap, WANAREJA_II_VILLAGES } from '../types/index';
import { aggregateRawatInapRecap, formatMonthLabel } from '../utils/recap';

interface RawatInapRecapSheetProps {
  records: PatientRecord[];
  onOpenRegisterRawatInap?: () => void;
}

const STATUS_PULANG_OPTIONS: StatusPulangRanap[] = [
  'Masih Dirawat',
  'Pulang Sehat / Sembuh',
  'Pulang Perbaikan',
  'Rujuk RSUD / RS Lanjutan',
  'Pulang APS',
  'Meninggal Dunia',
];

export const RawatInapRecapSheet: React.FC<RawatInapRecapSheetProps> = ({
  records,
  onOpenRegisterRawatInap,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [showAllDiagnosaChart, setShowAllDiagnosaChart] = useState(true);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records
      .filter((r) => r.statusKeluar === 'Rawat Inap Puskesmas' && !r.excludeFromRanap && r.tanggalMasuk)
      .forEach((r) => set.add(r.tanggalMasuk.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [records]);

  const recap = useMemo(() => {
    return aggregateRawatInapRecap(records, selectedMonth);
  }, [records, selectedMonth]);

  const chartDiagnosaData = useMemo(() => {
    if (showAllDiagnosaChart) {
      return recap.diagnosaCounts;
    }
    const activeOnly = recap.diagnosaCounts.filter((d) => d.count > 0);
    return activeOnly.length > 0 ? activeOnly : recap.diagnosaCounts;
  }, [recap.diagnosaCounts, showAllDiagnosaChart]);

  const desaBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    WANAREJA_II_VILLAGES.forEach((v) => {
      counts[v] = 0;
    });
    recap.items.forEach((item) => {
      const desa = (WANAREJA_II_VILLAGES as readonly string[]).includes(item.desa)
        ? item.desa
        : 'Luar Wilayah';
      counts[desa] = (counts[desa] || 0) + 1;
    });
    return WANAREJA_II_VILLAGES.map((desa) => ({
      desa,
      count: counts[desa] || 0,
      percent: recap.totalRanap > 0 ? Math.round(((counts[desa] || 0) / recap.totalRanap) * 100) : 0,
    }));
  }, [recap.items, recap.totalRanap]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 rounded-2xl p-5 text-white shadow-lg border border-sky-800/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
              <BedDouble className="w-6 h-6" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-sky-300 tracking-wider uppercase block">
                Dashboard Rekap • Rawat Inap • Terintegrasi IGD
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
                <span>Rekapitulasi Perawatan Rawat Inap</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-600/40 text-teal-200 border border-teal-400/30">
                  PUSKESMAS WANAREJA II
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-100 border border-sky-400/30">
                  {selectedMonth === 'ALL' ? 'Semua Bulan' : formatMonthLabel(selectedMonth)}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Analisis otomatis pasien Rawat Inap dari Register IGD: distribusi {DAFTAR_DIAGNOSA_MEDIS.length} Diagnosa ICD-10, Status Pulang, Lama Hari Rawat (ALOS), Penjaminan, &amp; Wilayah Desa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
                aria-label="Filter Bulan Rawat Inap"
              >
                <option value="ALL" className="text-slate-900">
                  Semua Bulan
                </option>
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="text-slate-900">
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>Cetak Laporan</span>
            </button>

            {onOpenRegisterRawatInap && (
              <button
                type="button"
                onClick={onOpenRegisterRawatInap}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Buka Register Rawat Inap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Total Pasien Rawat Inap</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">
              {recap.totalRanap}{' '}
              <span className="text-xs font-sans font-normal text-slate-400">pasien</span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Sedang Dirawat Aktif</div>
            <div className="text-xl sm:text-2xl font-black text-sky-300 mt-0.5 font-mono">
              {recap.masihDirawat}{' '}
              <span className="text-xs font-sans font-normal text-slate-400">pasien</span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Total Hari Perawatan</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5 font-mono">
              {recap.totalHariRawat}{' '}
              <span className="text-xs font-sans font-normal text-slate-400">hari rawat</span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/70">
            <div className="text-[11px] text-slate-400 font-medium">Rata-rata Hari Rawat (ALOS)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 font-mono">
              {recap.avgHariRawat}{' '}
              <span className="text-xs font-sans font-normal text-slate-400">hari/pasien</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Completion Alert Banner */}
      {recap.belumLengkapCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
              {recap.belumLengkapCount} Baru dari IGD
            </span>
            <span>
              Ada pasien rawat inap dari Register IGD yang belum dilengkapi Diagnosa ICD-10, Waktu Pulang, Hari Rawat, atau Status Pulang.
            </span>
          </div>
          {onOpenRegisterRawatInap && (
            <button
              type="button"
              onClick={onOpenRegisterRawatInap}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>Lengkapi di Register Rawat Inap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Analytics Row: Recharts Diagnosa Distribution & Status Pulang Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Horizontal Bar Chart of ICD-10 Diagnoses */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Grafik Batang Distribusi {DAFTAR_DIAGNOSA_MEDIS.length} Diagnosa Medis (ICD-10) Rawat Inap
                </h3>
                <p className="text-[11px] text-slate-500">
                  Visualisasi lengkap seluruh diagnosa standar rawat inap Puskesmas Wanareja II
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllDiagnosaChart((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
            >
              {showAllDiagnosaChart ? 'Tampilkan Diagnosa Aktif Saja' : `Tampilkan Semua ${DAFTAR_DIAGNOSA_MEDIS.length} Diagnosa`}
            </button>
          </div>

          <div
            className="w-full"
            style={{ height: Math.max(260, chartDiagnosaData.length * 29) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDiagnosaData}
                layout="vertical"
                margin={{ top: 6, right: 36, left: 10, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  type="category"
                  dataKey="diagnosa"
                  width={230}
                  tick={{ fontSize: 11, fill: '#0f172a' }}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value} pasien`, 'Jumlah Kasus']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Jumlah Kasus"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                  isAnimationActive={false}
                >
                  {chartDiagnosaData.map((entry, idx) => (
                    <Cell
                      key={`diag-${idx}`}
                      fill={entry.count > 0 ? '#0284c7' : '#cbd5e1'}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Status Pulang, Pembiayaan & Asal Desa Rawat Inap */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-sky-700" />
                <span>Rekap Status Pulang Rawat Inap</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">{recap.totalRanap} Kasus</span>
            </div>

            <div className="space-y-2.5">
              {STATUS_PULANG_OPTIONS.map((status) => {
                const count = recap.statusPulangCounts[status] || 0;
                const pct = recap.totalRanap > 0 ? Math.round((count / recap.totalRanap) * 100) : 0;
                return (
                  <div
                    key={status}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{status}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {count} <span className="text-[10px] text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  Penjaminan BPJS
                </span>
                <span className="font-mono font-bold text-teal-900">{recap.bpjsCount} pasien</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                <span className="font-semibold text-sky-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-700" />
                  Pasien Umum
                </span>
                <span className="font-mono font-bold text-sky-900">{recap.umumCount} pasien</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Asal Desa Pasien Rawat Inap</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                7 Desa Wilayah
              </span>
            </div>
            <div className="space-y-2">
              {desaBreakdown.map((d, idx) => (
                <div key={d.desa} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium text-[11px] flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{d.desa}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">
                      {d.count} <span className="text-slate-500 font-normal">({d.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.desa === 'Luar Wilayah' ? 'bg-amber-500' : 'bg-sky-600'
                      }`}
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Terintegrasi Register IGD
              </span>
              <span className="font-bold text-slate-700">PUSKESMAS WANAREJA II</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
