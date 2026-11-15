import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BarChart2, 
  PieChart as PieIcon, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck, 
  HeartPulse, 
  MapPin, 
  Stethoscope,
  Info
} from 'lucide-react';
import { MonthSummary, MonthlyTrendItem, RecapDashboardData } from '../utils/recap';
import { StatusKeluarIGD, KategoriPembayaran, WANAREJA_II_VILLAGES } from '../types/index';

interface RecapChartsProps {
  recap: RecapDashboardData;
  selectedMonth: string; // 'ALL' or 'YYYY-MM'
  onSelectMonth: (monthKey: string) => void;
}

export const RecapCharts: React.FC<RecapChartsProps> = ({
  recap,
  selectedMonth,
  onSelectMonth,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; dayNumber: number; count: number; p1: number; p2: number; p3: number } | null>(null);

  const isAllMonths = selectedMonth === 'ALL';
  const monthSummary = recap.selectedMonthSummary;
  const grandTotalAllMonths = recap.monthlyTrends.reduce((sum, t) => sum + t.total, 0);

  // Colors mapping
  const statusColors: Record<StatusKeluarIGD, { color: string; bg: string; text: string }> = {
    'Pulang Rawat Jalan': { color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-700' },
    'Rawat Inap Puskesmas': { color: '#0ea5e9', bg: 'bg-sky-500', text: 'text-sky-700' },
    'Rujuk RSUD / RS Lanjutan': { color: '#ef4444', bg: 'bg-rose-500', text: 'text-rose-700' },
    'Pulang APS (Permintaan Sendiri)': { color: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-700' },
    'Meninggal Dunia': { color: '#0f172a', bg: 'bg-slate-900', text: 'text-slate-900' },
  };

  const paymentColors: Record<KategoriPembayaran, { color: string; bg: string; text: string }> = {
    BPJS: { color: '#0d9488', bg: 'bg-teal-600', text: 'text-teal-700' },
    Umum: { color: '#0284c7', bg: 'bg-sky-600', text: 'text-sky-700' },
  };

  // Find max daily count for SVG scaling
  const dailyCounts = monthSummary ? monthSummary.dailyCounts : [];
  const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);

  // Find max month total for monthly trend chart
  const maxMonthTotal = Math.max(...recap.monthlyTrends.map((m) => m.total), 1);

  // Month-over-month growth calculation
  const currentTrendIdx = recap.monthlyTrends.findIndex((t) => t.monthKey === selectedMonth);
  let growthPct: number | null = null;
  if (currentTrendIdx > 0) {
    const prev = recap.monthlyTrends[currentTrendIdx - 1].total;
    const curr = recap.monthlyTrends[currentTrendIdx].total;
    if (prev > 0) {
      growthPct = Math.round(((curr - prev) / prev) * 100);
    }
  }

  // Calculate SVG Donut parameters for Payment Breakdown
  const paymentEntries = Object.entries(recap.kategoriPembayaran) as [KategoriPembayaran, number][];
  const totalPayPatients = paymentEntries.reduce((sum, [, count]) => sum + count, 0);

  let cumulativeAngle = 0;
  const donutSlices = paymentEntries.map(([payName, count]) => {
    const fraction = totalPayPatients > 0 ? count / totalPayPatients : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // SVG arc calculation (radius = 40, cx = 50, cy = 50)
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);
    const x1 = 50 + 38 * Math.cos(startRad);
    const y1 = 50 + 38 * Math.sin(startRad);
    const x2 = 50 + 38 * Math.cos(endRad);
    const y2 = 50 + 38 * Math.sin(endRad);
    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = totalPayPatients > 0 && fraction < 0.999
      ? `M ${x1} ${y1} A 38 38 0 ${largeArcFlag} 1 ${x2} ${y2}`
      : `M 50 12 A 38 38 0 1 1 49.99 12`;

    return {
      payName,
      count,
      percent: Math.round(fraction * 100),
      pathData,
      color: paymentColors[payName]?.color || '#94a3b8',
    };
  });

  return (
    <div className="space-y-5">
      {/* SECTION 1: Automatic Month Selector & Period Overview */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 rounded-2xl p-5 text-white shadow-lg border border-teal-800/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-teal-300 tracking-wider uppercase block">
                  Rekapitulasi Otomatis Berkala
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Rekap Bulanan Pasien IGD</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAllMonths ? 'Kumulatif Semua Bulan' : monthSummary?.label || selectedMonth}
                  </span>
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Data dikelompokkan secara otomatis per bulan kalender lengkap dengan grafik tren harian, skema penjaminan, asal desa, dan distribusi tindakan medis.
            </p>
          </div>

          {/* Month Selector Pills / Dropdown */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
            <span className="text-xs font-semibold text-slate-300 px-2 hidden sm:inline">Pilih Bulan:</span>
            <button
              onClick={() => onSelectMonth('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isAllMonths
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Semua ({grandTotalAllMonths})
            </button>
            {recap.availableMonths.map((mKey) => {
              const summary = recap.monthlySummaries[mKey];
              const isSelected = selectedMonth === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => onSelectMonth(mKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <span>{summary?.label || mKey}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {summary?.totalPatients || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Month KPI Highlight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {/* Card 1 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Total Pasien Bulan Ini</div>
            <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{recap.totalPatients}</span>
              <span className="text-xs font-normal text-slate-400">pasien</span>
              {growthPct !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  growthPct >= 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {growthPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`}
                </span>
              )}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Rata-rata Pasien / Hari</div>
            <div className="text-xl sm:text-2xl font-black text-teal-300 flex items-center gap-1.5 mt-0.5">
              <span>{monthSummary ? monthSummary.avgDaily : (recap.totalPatients / (recap.availableMonths.length * 30 || 1)).toFixed(1)}</span>
              <span className="text-xs font-normal text-slate-400">orang/hari</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Hari Kunjungan Tertinggi</div>
            <div className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1 mt-1">
              <span>{monthSummary ? `Tgl ${monthSummary.peakDay.dayNumber}` : 'Fluktuatif'}</span>
              <span className="text-xs text-slate-400 font-normal">
                ({monthSummary ? `${monthSummary.peakDay.count} pasien` : 'Beragam'})
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Rasio Rawat Inap & Rujuk</div>
            <div className="text-xl sm:text-2xl font-black text-rose-300 flex items-center gap-1.5 mt-0.5">
              <span>
                {recap.totalPatients > 0
                  ? Math.round(
                      (((recap.statusKeluar['Rawat Inap Puskesmas'] || 0) +
                        (recap.statusKeluar['Rujuk RSUD / RS Lanjutan'] || 0)) /
                        recap.totalPatients) *
                        100
                    )
                  : 0}%
              </span>
              <span className="text-xs font-normal text-slate-400">tindakan lanjut</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: GRAFIK TREN (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRAPH 1: Tren Bulanan Komparatif (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  <BarChart2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Grafik Tren Pasien Antar Bulan</h4>
                  <p className="text-[11px] text-slate-500">Perbandingan volume kunjungan tahun 2026</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {recap.monthlyTrends.length} Bulan
              </span>
            </div>

            {/* Bar Chart Visualization */}
            <div className="mt-4 space-y-3">
              {recap.monthlyTrends.map((trend) => {
                const isSelected = selectedMonth === trend.monthKey;
                const percentage = maxMonthTotal > 0 ? (trend.total / maxMonthTotal) * 100 : 0;
                return (
                  <div
                    key={trend.monthKey}
                    onClick={() => onSelectMonth(trend.monthKey)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`font-bold flex items-center gap-1.5 ${isSelected ? 'text-teal-800' : 'text-slate-700'}`}>
                        {trend.label}
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-700 text-white font-semibold">
                            Aktif
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {trend.total} <span className="text-[10px] font-normal text-slate-500">pasien</span>
                      </span>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                      {/* Rawat Jalan Segment */}
                      <div
                        style={{ width: `${(trend.rawatJalan / trend.total) * percentage}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                        title={`Rawat Jalan: ${trend.rawatJalan}`}
                      />
                      {/* Rawat Inap Segment */}
                      <div
                        style={{ width: `${(trend.rawatInap / trend.total) * percentage}%` }}
                        className="bg-sky-500 h-full transition-all duration-500"
                        title={`Rawat Inap: ${trend.rawatInap}`}
                      />
                      {/* Rujukan Segment */}
                      <div
                        style={{ width: `${(trend.rujuk / trend.total) * percentage}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                        title={`Rujuk RSUD: ${trend.rujuk}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>RJ: {trend.rawatJalan} • RI: {trend.rawatInap} • Rujuk: {trend.rujuk}</span>
                      <span className="font-semibold text-teal-700">BPJS: {trend.bpjs}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Rawat Jalan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Rawat Inap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Rujuk RSUD
              </span>
            </div>
            <span className="font-mono text-teal-800 font-semibold">Klik bar untuk filter</span>
          </div>
        </div>

        {/* GRAPH 2: Tren Kunjungan Harian dalam Bulan Terpilih (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Grafik Tren Harian: {monthSummary?.label || 'Bulan Terpilih'}
                  </h4>
                  <p className="text-[11px] text-slate-500">Distribusi kunjungan harian tanggal 1 s/d akhir bulan</p>
                </div>
              </div>

              {hoveredDay ? (
                <div className="text-xs bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-teal-800 font-mono">
                  <strong>Tgl {hoveredDay.dayNumber}:</strong> {hoveredDay.count} Pasien (P1:{hoveredDay.p1}, P2:{hoveredDay.p2}, P3:{hoveredDay.p3})
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">Arahkan kursor pada grafik</span>
              )}
            </div>

            {/* Interactive SVG Bar & Line Timeline */}
            <div className="mt-4 pt-2">
              {dailyCounts.length > 0 ? (
                <div className="space-y-2">
                  <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 px-1 py-2 bg-slate-50/70 rounded-xl border border-slate-100 relative">
                    {/* Dotted Average Line */}
                    {monthSummary && monthSummary.avgDaily > 0 && (
                      <div
                        style={{ bottom: `${(monthSummary.avgDaily / maxDaily) * 75}%` }}
                        className="absolute left-0 right-0 border-b border-dashed border-teal-400/70 pointer-events-none z-10 flex items-center justify-end pr-2"
                      >
                        <span className="text-[9px] text-teal-700 bg-white px-1 rounded shadow-2xs font-mono">
                          Rata-rata: {monthSummary.avgDaily}
                        </span>
                      </div>
                    )}

                    {dailyCounts.map((day) => {
                      const heightPercent = maxDaily > 0 ? Math.max((day.count / maxDaily) * 100, 6) : 6;
                      const hasPatients = day.count > 0;
                      const isHovered = hoveredDay?.dayNumber === day.dayNumber;

                      return (
                        <div
                          key={day.dayNumber}
                          onMouseEnter={() => setHoveredDay({
                            date: day.date,
                            dayNumber: day.dayNumber,
                            count: day.count,
                            p1: day.p1Count,
                            p2: day.p2Count,
                            p3: day.p3Count,
                          })}
                          onMouseLeave={() => setHoveredDay(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                        >
                          {/* Tooltip Popup on Hover */}
                          {isHovered && (
                            <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap animate-in fade-in duration-100 pointer-events-none">
                              <span className="font-bold">{day.date}</span>: {day.count} pasien
                            </div>
                          )}

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-md transition-all duration-300 relative ${
                              day.p1Count > 0
                                ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                                : hasPatients
                                ? 'bg-gradient-to-t from-teal-600 to-emerald-400 hover:from-teal-500 hover:to-emerald-300'
                                : 'bg-slate-200/60'
                            } ${isHovered ? 'ring-2 ring-teal-500 ring-offset-1' : ''}`}
                          >
                            {day.count > 0 && (
                              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-700 font-mono">
                                {day.count}
                              </span>
                            )}
                          </div>

                          {/* Day Label */}
                          <span className={`text-[9px] mt-1 font-mono ${hasPatients ? 'font-bold text-slate-700' : 'text-slate-400'}`}>
                            {day.dayNumber % 2 === 1 ? day.dayNumber : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Pasien Terdaftar
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 ml-2" /> Triage P1 Cito
                    </span>
                    <span className="font-semibold text-slate-700">
                      Total Bulan Ini: <strong>{monthSummary?.totalPatients || recap.totalPatients} Pasien</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                  Pilih bulan di atas untuk melihat rincian tanggal 1 s/d akhir bulan
                </div>
              )}
            </div>
          </div>

          {/* Quick takeaway badge */}
          <div className="p-3 mt-3 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between text-xs">
            <span className="text-teal-900 font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              Rekapitulasi otomatis disinkronkan langsung setiap ada pasien IGD baru terdaftar.
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-800 text-teal-100 whitespace-nowrap">
              PUSKESMAS WANAREJA II
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: GRAFIK KOMPONEN RINCI (3 Columns: Skema Bayar Donut, Status Keluar, Asal Desa) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CHART 3: Skema Pembiayaan (Donut SVG Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-teal-700" />
                <span>Grafik Skema Pembiayaan</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                BPJS & Umum
              </span>
            </div>

            {/* SVG Donut Center Graphic */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* Background track */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  {donutSlices.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.pathData}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeLinecap="round"
                      className="transition-all duration-500 hover:opacity-85"
                    />
                  ))}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 font-mono leading-none">
                    {totalPayPatients}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">Pasien</span>
                </div>
              </div>
            </div>

            {/* Legend & Details */}
            <div className="space-y-1.5 mt-2">
              {donutSlices.map((slice) => (
                <div key={slice.payName} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span style={{ backgroundColor: slice.color }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                    <span className="text-slate-700 font-medium text-[11px] truncate max-w-[130px]">{slice.payName}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-bold text-[11px]">
                    {slice.count} ({slice.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 4: Status Keluar IGD (Horizontal Comparative Bars) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>Grafik Status Keluar IGD</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Disposisi Akhir
              </span>
            </div>

            <div className="space-y-3 mt-2">
              {(Object.entries(recap.statusKeluar) as [StatusKeluarIGD, number][]).map(([status, count]) => {
                const total = recap.totalPatients;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                const cfg = statusColors[status];

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold text-[11px] truncate">{status}</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {count} <span className="text-slate-500 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%`, backgroundColor: cfg.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHART 5: Asal Desa Pasien (7 Desa Wanareja II) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                <span>Grafik Asal Desa Pasien</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                7 Desa Wilayah
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {WANAREJA_II_VILLAGES.map((desaName, idx) => {
                const count = recap.desa[desaName] || 0;
                const total = recap.totalPatients;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={desaName} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium text-[11px] flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{desaName}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {count} <span className="text-slate-500 font-normal">({percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          desaName === 'Luar Wilayah' ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 font-semibold text-right">
            PUSKESMAS WANAREJA II
          </div>
        </div>
      </div>
    </div>
  );
};
