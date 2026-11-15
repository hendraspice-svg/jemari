import {
  KategoriPembayaran,
  PatientRecord,
  StatusKeluarIGD,
  StatusPulangRanap,
  TriageCategory,
  DAFTAR_TINDAKAN_MEDIS_UMUM,
  DAFTAR_DIAGNOSA_MEDIS,
} from '../types/index';

export type AgeCategory = 
  | 'Balita (0-5 th)'
  | 'Anak (6-11 th)'
  | 'Remaja (12-18 th)'
  | 'Dewasa (19-59 th)'
  | 'Lansia (60+ th)';

export function getAgeCategory(age: number): AgeCategory {
  if (age <= 5) return 'Balita (0-5 th)';
  if (age <= 11) return 'Anak (6-11 th)';
  if (age <= 18) return 'Remaja (12-18 th)';
  if (age <= 59) return 'Dewasa (19-59 th)';
  return 'Lansia (60+ th)';
}

export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthLabel(monthKey: string): string {
  // monthKey: "YYYY-MM"
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = INDONESIAN_MONTH_NAMES[monthIdx] || monthStr;
  return `${monthName} ${yearStr}`;
}

export interface DailyPatientStat {
  date: string;
  dayNumber: number;
  count: number;
  p1Count: number;
  p2Count: number;
  p3Count: number;
}

export interface MonthSummary {
  monthKey: string; // e.g. "2026-11"
  label: string;    // e.g. "November 2026"
  year: number;
  month: number;
  totalPatients: number;
  dailyCounts: DailyPatientStat[];
  statusKeluar: Record<StatusKeluarIGD, number>;
  kategoriPembayaran: Record<KategoriPembayaran, number>;
  desa: Record<string, number>;
  triage: Record<TriageCategory, number>;
  tindakanMedisTop: { tindakan: string; count: number; percentage: number }[];
  gender: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
  ageGroups: Record<AgeCategory, number>;
  avgDaily: number;
  peakDay: { date: string; dayNumber: number; count: number };
}

export interface MonthlyTrendItem {
  monthKey: string;
  label: string;
  shortLabel: string;
  total: number;
  rawatJalan: number;
  rawatInap: number;
  rujuk: number;
  bpjs: number;
  umum: number;
}

export interface Last7DaysPoint {
  date: string;      // YYYY-MM-DD
  label: string;     // e.g. "08 Nov"
  dayName: string;   // e.g. "Min", "Sen"
  total: number;
  rawatJalan: number;
  rawatInap: number;
  rujuk: number;
}

export interface RawatInapItem {
  id: string;
  record: PatientRecord;
  namaPasien: string;
  umur: number;
  jenisKelamin: 'L' | 'P';
  desa: string;
  rt: string;
  rw: string;
  diagnosa: string;
  isDiagnosaIncomplete: boolean;
  masukTanggal: string;
  masukJam: string;
  keluarTanggal: string;
  keluarJam: string;
  jumlahHariRawat: number;
  kategoriPembayaran: KategoriPembayaran;
  nik: string;
  statusPulang: StatusPulangRanap;
}

export interface RawatInapRecapSummary {
  items: RawatInapItem[];
  totalRanap: number;
  masihDirawat: number;
  sudahPulang: number;
  belumLengkapCount: number;
  totalHariRawat: number;
  avgHariRawat: number;
  bpjsCount: number;
  umumCount: number;
  diagnosaCounts: { diagnosa: string; shortCode: string; count: number; percentage: number }[];
  statusPulangCounts: Record<StatusPulangRanap, number>;
}

export interface RecapDashboardData {
  totalPatients: number;
  gender: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
  ageGroups: Record<AgeCategory, number>;
  statusKeluar: Record<StatusKeluarIGD, number>;
  kategoriPembayaran: Record<KategoriPembayaran, number>;
  desa: Record<string, number>;
  tindakanMedisTop: { tindakan: string; count: number; percentage: number }[];
  tindakanMedisAll: { tindakan: string; count: number; percentage: number }[];
  triage: Record<TriageCategory, number>;
  rtRwDistribution: { desa: string; rtRw: string; count: number }[];
  // Monthly enhancements
  availableMonths: string[];
  monthlySummaries: Record<string, MonthSummary>;
  monthlyTrends: MonthlyTrendItem[];
  selectedMonthSummary?: MonthSummary;
}

export function normalizeKategoriPembayaran(val: unknown): KategoriPembayaran {
  if (typeof val === 'string' && val.toUpperCase().includes('BPJS')) {
    return 'BPJS';
  }
  return 'Umum';
}

/**
 * Automatically groups and aggregates all patient records per month,
 * including daily trends, components, and month-to-month comparisons.
 */
export function aggregateMonthlyRecaps(records: PatientRecord[]): {
  availableMonths: string[];
  monthlySummaries: Record<string, MonthSummary>;
  monthlyTrends: MonthlyTrendItem[];
} {
  // Group IGD records by YYYY-MM
  const igdRecords = records.filter((r) => !r.excludeFromIgd);
  const monthGroups: Record<string, PatientRecord[]> = {};

  igdRecords.forEach((r) => {
    const monthKey = r.tanggalMasuk ? r.tanggalMasuk.slice(0, 7) : '2026-11';
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = [];
    }
    monthGroups[monthKey].push(r);
  });

  // Sort months descending (latest month first)
  const availableMonths = Object.keys(monthGroups).sort().reverse();
  const monthlySummaries: Record<string, MonthSummary> = {};

  availableMonths.forEach((monthKey) => {
    const monthRecords = monthGroups[monthKey];
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const label = formatMonthLabel(monthKey);

    // Calculate days in this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap: Record<number, { count: number; p1: number; p2: number; p3: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { count: 0, p1: 0, p2: 0, p3: 0 };
    }

    let maleCount = 0;
    let femaleCount = 0;

    const ageGroups: Record<AgeCategory, number> = {
      'Balita (0-5 th)': 0,
      'Anak (6-11 th)': 0,
      'Remaja (12-18 th)': 0,
      'Dewasa (19-59 th)': 0,
      'Lansia (60+ th)': 0,
    };

    const statusKeluar: Record<StatusKeluarIGD, number> = {
      'Pulang Rawat Jalan': 0,
      'Rawat Inap Puskesmas': 0,
      'Rujuk RSUD / RS Lanjutan': 0,
      'Pulang APS (Permintaan Sendiri)': 0,
      'Meninggal Dunia': 0,
    };

    const kategoriPembayaran: Record<KategoriPembayaran, number> = {
      BPJS: 0,
      Umum: 0,
    };

    const desaCount: Record<string, number> = {};
    const tindakanCount: Record<string, number> = {};
    const triageCount: Record<TriageCategory, number> = {
      P1: 0,
      P2: 0,
      P3: 0,
      P0: 0,
    };

    monthRecords.forEach((r) => {
      // Daily count
      const dayNum = parseInt(r.tanggalMasuk.slice(8, 10), 10);
      if (dailyMap[dayNum]) {
        dailyMap[dayNum].count++;
        if (r.triage === 'P1') dailyMap[dayNum].p1++;
        else if (r.triage === 'P2') dailyMap[dayNum].p2++;
        else if (r.triage === 'P3') dailyMap[dayNum].p3++;
      }

      // Gender
      if (r.jenisKelamin === 'L') maleCount++;
      else if (r.jenisKelamin === 'P') femaleCount++;

      // Age Group
      ageGroups[getAgeCategory(r.umur)]++;

      // Status Keluar
      if (statusKeluar[r.statusKeluar] !== undefined) {
        statusKeluar[r.statusKeluar]++;
      }

      // Payment (BPJS or Umum)
      const payCategory = normalizeKategoriPembayaran(r.kategoriPembayaran);
      kategoriPembayaran[payCategory]++;

      // Desa
      const d = r.alamat.desa || 'Luar Wilayah';
      desaCount[d] = (desaCount[d] || 0) + 1;

      // Tindakan
      if (r.tindakanMedisUmum) {
        let matched = false;
        DAFTAR_TINDAKAN_MEDIS_UMUM.forEach((std) => {
          if (r.tindakanMedisUmum.includes(std)) {
            tindakanCount[std] = (tindakanCount[std] || 0) + 1;
            matched = true;
          }
        });
        if (!matched) {
          const raw = r.tindakanMedisUmum.trim();
          tindakanCount[raw] = (tindakanCount[raw] || 0) + 1;
        }
      }

      // Triage
      if (r.triage && triageCount[r.triage] !== undefined) {
        triageCount[r.triage]++;
      }
    });

    const total = monthRecords.length;
    const dailyCounts: DailyPatientStat[] = Object.entries(dailyMap).map(([dStr, val]) => {
      const d = parseInt(dStr, 10);
      const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
      return {
        date: dateStr,
        dayNumber: d,
        count: val.count,
        p1Count: val.p1,
        p2Count: val.p2,
        p3Count: val.p3,
      };
    });

    // Peak day
    let peakDay = { date: `${monthKey}-01`, dayNumber: 1, count: 0 };
    dailyCounts.forEach((d) => {
      if (d.count > peakDay.count) {
        peakDay = { date: d.date, dayNumber: d.dayNumber, count: d.count };
      }
    });

    // Active days count for avg
    const activeDays = dailyCounts.filter((d) => d.count > 0).length || 1;
    const avgDaily = parseFloat((total / activeDays).toFixed(1));

    const tindakanMedisTop = Object.entries(tindakanCount)
      .map(([tindakan, count]) => ({
        tindakan,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    monthlySummaries[monthKey] = {
      monthKey,
      label,
      year,
      month,
      totalPatients: total,
      dailyCounts,
      statusKeluar,
      kategoriPembayaran,
      desa: desaCount,
      triage: triageCount,
      tindakanMedisTop,
      gender: {
        male: maleCount,
        female: femaleCount,
        malePercent: total > 0 ? Math.round((maleCount / total) * 100) : 0,
        femalePercent: total > 0 ? Math.round((femaleCount / total) * 100) : 0,
      },
      ageGroups,
      avgDaily,
      peakDay,
    };
  });

  // Build chronological trends (oldest to latest month for chart display)
  const monthlyTrends: MonthlyTrendItem[] = [...availableMonths]
    .reverse()
    .map((monthKey) => {
      const summary = monthlySummaries[monthKey];
      const monthIdx = summary.month - 1;
      const shortMonth = INDONESIAN_MONTH_NAMES[monthIdx]
        ? INDONESIAN_MONTH_NAMES[monthIdx].slice(0, 3)
        : monthKey;
      return {
        monthKey,
        label: summary.label,
        shortLabel: `${shortMonth} '${String(summary.year).slice(2)}`,
        total: summary.totalPatients,
        rawatJalan: summary.statusKeluar['Pulang Rawat Jalan'] || 0,
        rawatInap: summary.statusKeluar['Rawat Inap Puskesmas'] || 0,
        rujuk: summary.statusKeluar['Rujuk RSUD / RS Lanjutan'] || 0,
        bpjs: summary.kategoriPembayaran['BPJS'] || 0,
        umum: summary.kategoriPembayaran['Umum'] || 0,
      };
    });

  return {
    availableMonths,
    monthlySummaries,
    monthlyTrends,
  };
}

export function aggregateRecapDashboard(
  records: PatientRecord[],
  selectedMonthKey?: string
): RecapDashboardData {
  const igdRecords = records.filter((r) => !r.excludeFromIgd);
  const { availableMonths, monthlySummaries, monthlyTrends } = aggregateMonthlyRecaps(igdRecords);

  // If a specific month is selected (and exists), filter records to that month
  let targetRecords = igdRecords;
  if (selectedMonthKey && selectedMonthKey !== 'ALL' && monthlySummaries[selectedMonthKey]) {
    targetRecords = igdRecords.filter((r) => r.tanggalMasuk && r.tanggalMasuk.startsWith(selectedMonthKey));
  }

  const total = targetRecords.length;

  let maleCount = 0;
  let femaleCount = 0;

  const ageGroups: Record<AgeCategory, number> = {
    'Balita (0-5 th)': 0,
    'Anak (6-11 th)': 0,
    'Remaja (12-18 th)': 0,
    'Dewasa (19-59 th)': 0,
    'Lansia (60+ th)': 0,
  };

  const statusKeluar: Record<StatusKeluarIGD, number> = {
    'Pulang Rawat Jalan': 0,
    'Rawat Inap Puskesmas': 0,
    'Rujuk RSUD / RS Lanjutan': 0,
    'Pulang APS (Permintaan Sendiri)': 0,
    'Meninggal Dunia': 0,
  };

  const kategoriPembayaran: Record<KategoriPembayaran, number> = {
    BPJS: 0,
    Umum: 0,
  };

  const desaCount: Record<string, number> = {};
  const rtRwCountMap: Record<string, number> = {};
  const tindakanCount: Record<string, number> = {};
  const triageCount: Record<TriageCategory, number> = {
    P1: 0,
    P2: 0,
    P3: 0,
    P0: 0,
  };

  targetRecords.forEach((r) => {
    // Gender
    if (r.jenisKelamin === 'L') maleCount++;
    else if (r.jenisKelamin === 'P') femaleCount++;

    // Age Group
    const ageGrp = getAgeCategory(r.umur);
    ageGroups[ageGrp]++;

    // Status Keluar
    if (statusKeluar[r.statusKeluar] !== undefined) {
      statusKeluar[r.statusKeluar]++;
    }

    // Kategori Pembayaran (BPJS or Umum)
    const payCategory = normalizeKategoriPembayaran(r.kategoriPembayaran);
    kategoriPembayaran[payCategory]++;

    // Desa
    const d = r.alamat.desa || 'Luar Wilayah';
    desaCount[d] = (desaCount[d] || 0) + 1;

    // RT/RW
    const rtrwKey = `${d}|RT ${r.alamat.rt} / RW ${r.alamat.rw}`;
    rtRwCountMap[rtrwKey] = (rtRwCountMap[rtrwKey] || 0) + 1;

    // Tindakan Medis: Tally standard procedures from DAFTAR_TINDAKAN_MEDIS_UMUM
    let matchedStandard = false;
    if (r.tindakanMedisUmum) {
      DAFTAR_TINDAKAN_MEDIS_UMUM.forEach((std) => {
        if (r.tindakanMedisUmum.includes(std)) {
          tindakanCount[std] = (tindakanCount[std] || 0) + 1;
          matchedStandard = true;
        }
      });
    }
    if (!matchedStandard) {
      const rawAction = r.tindakanMedisUmum ? r.tindakanMedisUmum.trim() : 'Pemeriksaan Dokter & Edukasi';
      tindakanCount[rawAction] = (tindakanCount[rawAction] || 0) + 1;
    }

    // Triage
    if (r.triage && triageCount[r.triage] !== undefined) {
      triageCount[r.triage]++;
    }
  });

  const tindakanMedisAll = DAFTAR_TINDAKAN_MEDIS_UMUM.map((std) => {
    const count = tindakanCount[std] || 0;
    return {
      tindakan: std,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  }).sort((a, b) => b.count - a.count);

  const tindakanMedisTop = Object.entries(tindakanCount)
    .map(([tindakan, count]) => ({
      tindakan,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const rtRwDistribution = Object.entries(rtRwCountMap)
    .map(([key, count]) => {
      const [desa, rtRw] = key.split('|');
      return { desa, rtRw, count };
    })
    .sort((a, b) => b.count - a.count);

  const selectedMonthSummary = selectedMonthKey && selectedMonthKey !== 'ALL'
    ? monthlySummaries[selectedMonthKey]
    : undefined;

  return {
    totalPatients: total,
    gender: {
      male: maleCount,
      female: femaleCount,
      malePercent: total > 0 ? Math.round((maleCount / total) * 100) : 0,
      femalePercent: total > 0 ? Math.round((femaleCount / total) * 100) : 0,
    },
    ageGroups,
    statusKeluar,
    kategoriPembayaran,
    desa: desaCount,
    tindakanMedisTop,
    tindakanMedisAll,
    triage: triageCount,
    rtRwDistribution,
    availableMonths,
    monthlySummaries,
    monthlyTrends,
    selectedMonthSummary,
  };
}

const SHORT_DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function parseUtcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
}

function formatUtcDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes daily visit counts over the last 7 consecutive days ending at referenceDateStr
 * (or the latest patient record date if today has no nearby records).
 */
export function getLast7DaysTrend(
  records: PatientRecord[],
  referenceDateStr?: string
): Last7DaysPoint[] {
  const igdRecords = records.filter((r) => !r.excludeFromIgd);
  let endDateStr = referenceDateStr;

  if (!endDateStr) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sortedDates = igdRecords
      .map((r) => r.tanggalMasuk)
      .filter((d) => Boolean(d && /^\d{4}-\d{2}-\d{2}$/.test(d)))
      .sort()
      .reverse();

    const latestRecordDate = sortedDates[0] || todayStr;
    // Use today if records exist within the 7-day window ending today; otherwise anchor to latestRecordDate
    const todayMs = parseUtcDate(todayStr).getTime();
    const sixDaysAgoMs = todayMs - 6 * 86400000;
    const hasRecentToday = sortedDates.some((d) => {
      const ms = parseUtcDate(d).getTime();
      return ms >= sixDaysAgoMs && ms <= todayMs;
    });
    endDateStr = hasRecentToday ? todayStr : latestRecordDate;
  }

  const endDate = parseUtcDate(endDateStr);
  const points: Last7DaysPoint[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const curDate = new Date(endDate.getTime() - offset * 86400000);
    const isoDate = formatUtcDate(curDate);
    const dayRecords = igdRecords.filter((r) => r.tanggalMasuk === isoDate);

    const monthShort = INDONESIAN_MONTH_NAMES[curDate.getUTCMonth()]?.slice(0, 3) || '';
    const dayNum = String(curDate.getUTCDate()).padStart(2, '0');
    const dayName = SHORT_DAY_NAMES_ID[curDate.getUTCDay()] || '';

    points.push({
      date: isoDate,
      label: `${dayNum} ${monthShort}`,
      dayName,
      total: dayRecords.length,
      rawatJalan: dayRecords.filter((r) => r.statusKeluar === 'Pulang Rawat Jalan').length,
      rawatInap: dayRecords.filter((r) => r.statusKeluar === 'Rawat Inap Puskesmas').length,
      rujuk: dayRecords.filter((r) => r.statusKeluar === 'Rujuk RSUD / RS Lanjutan').length,
    });
  }

  return points;
}

/**
 * Calculates inpatient length of stay (Jumlah Hari Rawat) in calendar days (minimum 1 day).
 */
export function calculateLengthOfStay(
  tanggalMasuk: string,
  tanggalKeluar?: string,
  referenceDateStr?: string
): number {
  if (!tanggalMasuk || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalMasuk)) return 1;
  const startMs = parseUtcDate(tanggalMasuk).getTime();

  const effectiveEnd =
    tanggalKeluar && /^\d{4}-\d{2}-\d{2}$/.test(tanggalKeluar)
      ? tanggalKeluar
      : referenceDateStr && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateStr)
      ? referenceDateStr
      : new Date().toISOString().slice(0, 10);

  const endMs = parseUtcDate(effectiveEnd).getTime();
  if (endMs <= startMs) return 1;

  const diffDays = Math.round((endMs - startMs) / 86400000);
  return Math.max(1, diffDays);
}

/**
 * Integrates IGD patient records with statusKeluar === 'Rawat Inap Puskesmas'
 * into the Inpatient Care Recapitulation (Rekap Perawatan Rawat Inap).
 */
export function aggregateRawatInapRecap(
  records: PatientRecord[],
  selectedMonthKey?: string,
  referenceDateStr?: string
): RawatInapRecapSummary {
  const ranapRecords = records.filter((r) => {
    if (r.statusKeluar !== 'Rawat Inap Puskesmas' || r.excludeFromRanap) return false;
    if (selectedMonthKey && selectedMonthKey !== 'ALL') {
      return Boolean(r.tanggalMasuk && r.tanggalMasuk.startsWith(selectedMonthKey));
    }
    return true;
  });

  const statusPulangCounts: Record<StatusPulangRanap, number> = {
    'Masih Dirawat': 0,
    'Pulang Sehat / Sembuh': 0,
    'Pulang Perbaikan': 0,
    'Rujuk RSUD / RS Lanjutan': 0,
    'Pulang APS': 0,
    'Meninggal Dunia': 0,
  };

  const diagnosaMap: Record<string, number> = {};
  DAFTAR_DIAGNOSA_MEDIS.forEach((d) => {
    diagnosaMap[d] = 0;
  });

  let masihDirawat = 0;
  let sudahPulang = 0;
  let belumLengkapCount = 0;
  let totalHariRawat = 0;
  let bpjsCount = 0;
  let umumCount = 0;

  const items: RawatInapItem[] = ranapRecords.map((r) => {
    const statusPulang: StatusPulangRanap =
      r.statusPulangRanap || (r.tanggalKeluar ? 'Pulang Sehat / Sembuh' : 'Masih Dirawat');

    if (statusPulangCounts[statusPulang] !== undefined) {
      statusPulangCounts[statusPulang]++;
    }

    if (statusPulang === 'Masih Dirawat') masihDirawat++;
    else sudahPulang++;

    const autoLos = calculateLengthOfStay(r.tanggalMasuk, r.tanggalKeluar, referenceDateStr);
    const jumlahHariRawat =
      typeof r.jumlahHariRawatManual === 'number' && r.jumlahHariRawatManual >= 0
        ? Math.round(r.jumlahHariRawatManual)
        : autoLos;
    totalHariRawat += jumlahHariRawat;

    const pay = normalizeKategoriPembayaran(r.kategoriPembayaran);
    if (pay === 'BPJS') bpjsCount++;
    else umumCount++;

    const rawDiag = (r.diagnosa || '').trim();
    const isDiagnosaIncomplete = !rawDiag || rawDiag === 'Belum Dilengkapi';
    const diagnosa = isDiagnosaIncomplete ? 'Belum Dilengkapi' : rawDiag;

    if (isDiagnosaIncomplete) {
      belumLengkapCount++;
    } else if (diagnosaMap[diagnosa] !== undefined) {
      diagnosaMap[diagnosa]++;
    } else {
      diagnosaMap[diagnosa] = (diagnosaMap[diagnosa] || 0) + 1;
    }

    return {
      id: r.id,
      record: r,
      namaPasien: r.namaPasien,
      umur: r.umur,
      jenisKelamin: r.jenisKelamin,
      desa: r.alamat.desa,
      rt: r.alamat.rt,
      rw: r.alamat.rw,
      diagnosa,
      isDiagnosaIncomplete,
      masukTanggal: r.tanggalMasuk,
      masukJam: r.jamMasuk || '-',
      keluarTanggal: r.tanggalKeluar || '-',
      keluarJam: r.jamKeluar || '-',
      jumlahHariRawat,
      kategoriPembayaran: pay,
      nik: r.nik,
      statusPulang,
    };
  });

  const totalRanap = items.length;
  const avgHariRawat = totalRanap > 0 ? parseFloat((totalHariRawat / totalRanap).toFixed(1)) : 0;

  const diagnosaCounts = Object.entries(diagnosaMap)
    .map(([diagnosa, count]) => {
      const parts = diagnosa.split(' - ');
      const shortCode = parts.length > 1 ? parts[parts.length - 1] : diagnosa.slice(0, 12);
      return {
        diagnosa,
        shortCode,
        count,
        percentage: totalRanap > 0 ? Math.round((count / totalRanap) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    items,
    totalRanap,
    masihDirawat,
    sudahPulang,
    belumLengkapCount,
    totalHariRawat,
    avgHariRawat,
    bpjsCount,
    umumCount,
    diagnosaCounts,
    statusPulangCounts,
  };
}
