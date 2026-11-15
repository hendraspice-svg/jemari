import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  HeartPulse, 
  Printer, 
  Calendar,
  ArrowRight,
  TrendingUp,
  BedDouble
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Cell,
} from 'recharts';
import { PatientRecord } from '../types/index';
import {
  aggregateRecapDashboard,
  aggregateRawatInapRecap,
  getLast7DaysTrend,
} from '../utils/recap';
import { RecapCharts } from './RecapCharts';

interface DashboardRecapProps {
  records: PatientRecord[];
  onOpenAddModal: () => void;
  onOpenRawatInapTab?: () => void;
  canManageRecords?: boolean;
}

export const DashboardRecap: React.FC<DashboardRecapProps> = ({
  records,
  onOpenAddModal,
  onOpenRawatInapTab,
  canManageRecords = true,
}) => {
  // Compute available months from all records
  const initialMonthlyRecap = useMemo(() => aggregateRecapDashboard(records), [records]);
  const defaultMonth = initialMonthlyRecap.availableMonths[0] || '2026-11';

  // Selected month filter ('ALL' or 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  // Compute full recap with automatic monthly breakdown
  const recap = useMemo(() => {
    return aggregateRecapDashboard(records, selectedMonth);
  }, [records, selectedMonth]);

  // 7-day daily visit trend via Recharts
  const last7DaysTrend = useMemo(() => getLast7DaysTrend(records), [records]);
  const total7DaysVisits = useMemo(
    () => last7DaysTrend.reduce((sum, d) => sum + d.total, 0),
    [last7DaysTrend]
  );

  // Integrated Rawat Inap summary
  const rawatInapSummary = useMemo(
    () => aggregateRawatInapRecap(records, selectedMonth),
    [records, selectedMonth]
  );

  const isAllMonths = selectedMonth === 'ALL';
  const monthSummary = recap.selectedMonthSummary;

  return (
    <div className="space-y-6">
      {/* Top Banner with Filter */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#48c78e]/20 text-teal-900 border border-[#48c78e]/40">
              <BarChart3 className="w-5 h-5 text-teal-800" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Dashboard Rekapitulasi Komponen Pasien IGD</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-800 text-teal-100 border border-teal-600">
                  PUSKESMAS WANAREJA II
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {isAllMonths ? 'Semua Bulan (Kumulatif)' : monthSummary?.label || selectedMonth}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekap otomatis per bulan: Tanggal Masuk, NIK, No. RM, Status Keluar, Umur, Gender, Alamat (Desa/RT/RW), Tindakan Medis & Pembayaran • PUSKESMAS WANAREJA II
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Print */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Cetak Laporan Rekapitulasi Lengkap"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Laporan</span>
          </button>
          {canManageRecords && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>+ Pasien Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* COMPONENT: RECAP CHARTS & MONTHLY AUTOMATIC ANALYTICS */}
      <RecapCharts
        recap={recap}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* SECTION: RECHARTS TREN KUNJUNGAN PASIEN 7 HARI TERAKHIR & RINGKASAN RAWAT INAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Grafik Tren Kunjungan Pasien Per Hari (7 Hari Terakhir)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Visualisasi Recharts kunjungan harian IGD beserta disposisi Rawat Jalan, Rawat Inap &amp; Rujuk RSUD
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {total7DaysVisits} Kunjungan (7 Hari)
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={last7DaysTrend}
                margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotalVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorRanapVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Kunjungan"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotalVisits)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rawatInap"
                  name="Rawat Inap"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRanapVisits)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rawatJalan"
                  name="Rawat Jalan"
                  stroke="#10b981"
                  strokeWidth={1.8}
                  fillOpacity={0}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="rujuk"
                  name="Rujuk RSUD"
                  stroke="#e11d48"
                  strokeWidth={1.8}
                  fillOpacity={0}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Integrated Rawat Inap Quick Overview Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-sky-900 via-slate-900 to-slate-950 rounded-2xl p-5 text-white border border-sky-800/60 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  <BedDouble className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Integrasi Perawatan Rawat Inap</h3>
                  <p className="text-[11px] text-slate-400">
                    {isAllMonths ? 'Semua Bulan' : monthSummary?.label || selectedMonth}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                Terintegrasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Pasien Rawat Inap</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {rawatInapSummary.totalRanap}
                </div>
              </div>
              <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Masih Dirawat</div>
                <div className="text-xl font-black text-sky-300 font-mono mt-0.5">
                  {rawatInapSummary.masihDirawat}
                </div>
              </div>
              <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Total Hari Rawat</div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
                  {rawatInapSummary.totalHariRawat} <span className="text-[10px] font-normal">hr</span>
                </div>
              </div>
              <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Rata-rata Rawat</div>
                <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                  {rawatInapSummary.avgHariRawat} <span className="text-[10px] font-normal">hr</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/50 rounded-xl p-3 border border-slate-700/60">
              <span className="font-semibold text-sky-300 block mb-1">Diagnosa Rawat Inap Terbanyak:</span>
              {rawatInapSummary.diagnosaCounts.filter((d) => d.count > 0).slice(0, 2).map((d) => (
                <div key={d.diagnosa} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="truncate pr-2">{d.diagnosa}</span>
                  <span className="font-mono font-bold text-white shrink-0">{d.count}x</span>
                </div>
              ))}
              {rawatInapSummary.totalRanap === 0 && (
                <span className="text-[11px] text-slate-400 italic">Belum ada pasien rawat inap di periode ini.</span>
              )}
            </div>
          </div>

          {onOpenRawatInapTab && (
            <button
              type="button"
              onClick={onOpenRawatInapTab}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Buka Rawat Inap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION: TABEL RINGKASAN REKAPITULASI PER BULAN (OTOMATIS) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-700 text-white">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                Tabel Rekapitulasi Rincian Kunjungan Per Bulan (Otomatis)
              </h3>
              <p className="text-[11px] text-slate-500">
                Data otomatis diperbarui dari setiap pasien yang terdaftar di Buku Register IGD
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-mono">
            {recap.availableMonths.length} Bulan Terdata (Tahun 2026)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="px-4 py-2.5">Bulan Pelayanan</th>
                <th className="px-3 py-2.5 text-center">Total Pasien</th>
                <th className="px-3 py-2.5 text-center">Rawat Jalan</th>
                <th className="px-3 py-2.5 text-center">Rawat Inap</th>
                <th className="px-3 py-2.5 text-center">Rujuk RSUD</th>
                <th className="px-3 py-2.5 text-center">Pulang APS</th>
                <th className="px-3 py-2.5 text-center">BPJS</th>
                <th className="px-3 py-2.5 text-center">Umum</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recap.monthlyTrends.map((trend) => {
                const summary = recap.monthlySummaries[trend.monthKey];
                const isSelected = selectedMonth === trend.monthKey;
                const apsCount = summary?.statusKeluar['Pulang APS (Permintaan Sendiri)'] || 0;

                return (
                  <tr
                    key={trend.monthKey}
                    className={`transition ${
                      isSelected ? 'bg-teal-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{trend.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-700 text-white">
                            Aktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {trend.total}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-emerald-700 font-semibold">
                        {trend.rawatJalan}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-sky-700 font-semibold">
                        {trend.rawatInap}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-rose-700 font-semibold">
                        {trend.rujuk}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-amber-700 font-semibold">
                        {apsCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-teal-700 font-semibold">
                        {trend.bpjs}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-slate-700">
                        {trend.umum}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedMonth(trend.monthKey)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700'
                        }`}
                      >
                        <span>Lihat Grafik</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: RINCIAN KOMPONEN DEMOGRAFI & SEMUA 21 TINDAKAN MEDIS UMUM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Semua 21 Tindakan Medis Umum + Grafik Batang (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                <span>Rekapitulasi Semua Tindakan Medis Umum ({isAllMonths ? 'Semua Bulan' : monthSummary?.label})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan seluruh {recap.tindakanMedisAll.length} Tindakan Medis Umum standar dilengkapi Grafik Batang Recharts
              </p>
            </div>
            <span className="text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full font-bold font-mono">
              {recap.tindakanMedisAll.length} Tindakan Standar
            </span>
          </div>

          {/* Recharts Horizontal Bar Chart of all 21 Tindakan Medis Umum */}
          <div className="w-full h-[640px] bg-slate-50/60 rounded-xl border border-slate-200 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recap.tindakanMedisAll}
                layout="vertical"
                margin={{ top: 6, right: 40, left: 10, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  type="category"
                  dataKey="tindakan"
                  width={235}
                  tick={{ fontSize: 11, fill: '#0f172a' }}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value} kali`, 'Frekuensi Tindakan']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Frekuensi Tindakan"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                  isAnimationActive={false}
                >
                  {recap.tindakanMedisAll.map((entry, idx) => (
                    <Cell
                      key={`tind-${idx}`}
                      fill={entry.count > 0 ? '#0d9488' : '#cbd5e1'}
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

          {/* Complete 21-item Numbered Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recap.tindakanMedisAll.map((item, idx) => (
              <div
                key={item.tindakan}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                  item.count > 0
                    ? 'bg-teal-50/40 border-teal-200 hover:bg-teal-50/70'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      item.count > 0 ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 truncate" title={item.tindakan}>
                    {item.tindakan}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                      item.count > 0
                        ? 'text-teal-800 bg-teal-50 border-teal-200'
                        : 'text-slate-500 bg-white border-slate-200'
                    }`}
                  >
                    {item.count} kali ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rekap Triage IGD (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Kategori Triage IGD</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Prioritas Penanganan</span>
            </div>

            <div className="space-y-2.5">
              {/* P1 */}
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-700 block">P1 - Merah (Resusitasi Cito)</span>
                  <span className="text-[10px] text-rose-500">Gawat Darurat Mengancam Jiwa</span>
                </div>
                <span className="text-base font-mono font-bold text-rose-700">
                  {recap.triage.P1}
                </span>
              </div>

              {/* P2 */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-700 block">P2 - Kuning (Urgent)</span>
                  <span className="text-[10px] text-amber-500">Darurat Tidak Gawat</span>
                </div>
                <span className="text-base font-mono font-bold text-amber-700">
                  {recap.triage.P2}
                </span>
              </div>

              {/* P3 */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">P3 - Hijau (Non-Urgent)</span>
                  <span className="text-[10px] text-emerald-500">Tidak Gawat Tidak Darurat</span>
                </div>
                <span className="text-base font-mono font-bold text-emerald-700">
                  {recap.triage.P3}
                </span>
              </div>

              {/* P0 */}
              <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">P0 - Hitam (DOA)</span>
                  <span className="text-[10px] text-slate-400">Death on Arrival</span>
                </div>
                <span className="text-base font-mono font-bold text-white">
                  {recap.triage.P0}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-600 font-semibold block">PUSKESMAS WANAREJA II</span>
            <span className="text-[11px] text-slate-400 font-medium">Kabupaten Cilacap</span>
          </div>
        </div>
      </div>
    </div>
  );
};
