import { Bed, TriageCategory, VitalSigns } from '../types/index';

/**
 * Standard triage response time targets in minutes (ATS/ESI aligned for Indonesian Puskesmas IGD)
 */
export const TRIAGE_TARGET_MINUTES: Record<TriageCategory, number> = {
  P1: 0,   // Resusitasi / Gawat Darurat - Segera (0 menit)
  P2: 10,  // Darurat Tidak Gawat - Kurang dari 10 menit
  P3: 30,  // Tidak Gawat Tidak Darurat - Kurang dari 30 menit
  P0: 0,   // Death on Arrival - Evaluasi konfirmasi kematian
};

export const TRIAGE_CONFIG: Record<TriageCategory, {
  label: string;
  subLabel: string;
  colorName: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  indicatorColor: string;
  description: string;
}> = {
  P1: {
    label: 'P1 - Merah (Gawat Darurat)',
    subLabel: 'Resusitasi Segera',
    colorName: 'Merah',
    bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    textBadge: 'text-rose-600',
    borderBadge: 'border-rose-500',
    indicatorColor: 'bg-rose-500',
    description: 'Ancaman henti napas/jantung, syok berat, penurunan kesadaran berat, trauma mayor.',
  },
  P2: {
    label: 'P2 - Kuning (Darurat Tidak Gawat)',
    subLabel: 'Penanganan Urgent',
    colorName: 'Kuning',
    bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    textBadge: 'text-amber-600',
    borderBadge: 'border-amber-500',
    indicatorColor: 'bg-amber-500',
    description: 'Potensi mengancam jiwa jika tidak segera ditangani, nyeri berat, fraktur, dehidrasi.',
  },
  P3: {
    label: 'P3 - Hijau (Tidak Gawat Tidak Darurat)',
    subLabel: 'Non-Urgent',
    colorName: 'Hijau',
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textBadge: 'text-emerald-600',
    borderBadge: 'border-emerald-500',
    indicatorColor: 'bg-emerald-500',
    description: 'Kondisi stabil, luka ringan, keluhan kronis, batuk pilek, dapat menunggu antrean.',
  },
  P0: {
    label: 'P0 - Hitam (DOA)',
    subLabel: 'Meninggal Dunia',
    colorName: 'Hitam',
    bgBadge: 'bg-slate-800 text-white border-slate-700',
    textBadge: 'text-slate-900',
    borderBadge: 'border-slate-800',
    indicatorColor: 'bg-slate-900',
    description: 'Pasien tiba tanpa tanda kehidupan (Death on Arrival), dilatasi pupil maksimal, asitol.',
  },
};

/**
 * Evaluate triage category from vital signs and clinical assessment
 */
export function evaluateTriagePriority(
  vitals: Partial<VitalSigns>,
  complaint: string = '',
  isDeathOnArrival: boolean = false
): { category: TriageCategory; reason: string; priorityScore: number } {
  if (isDeathOnArrival) {
    return {
      category: 'P0',
      reason: 'Tanda klinis kematian pasti saat tiba (DOA)',
      priorityScore: 0,
    };
  }

  const reasons: string[] = [];
  const lowerComplaint = complaint.toLowerCase();

  // Critical indicators for P1 (Merah)
  if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation < 90) {
    reasons.push(`Saturasi O2 kritis (${vitals.oxygenSaturation}%)`);
  }
  if (vitals.respiratoryRate !== undefined && (vitals.respiratoryRate > 35 || vitals.respiratoryRate < 10)) {
    reasons.push(`Frekuensi napas tidak stabil (${vitals.respiratoryRate} x/mnt)`);
  }
  if (vitals.heartRate !== undefined && (vitals.heartRate > 140 || vitals.heartRate < 45)) {
    reasons.push(`Nadi kritis (${vitals.heartRate} bpm)`);
  }
  if (vitals.systolic !== undefined && vitals.systolic > 0 && vitals.systolic < 85) {
    reasons.push(`Hipotensi / kecurigaan syok (${vitals.systolic} mmHg)`);
  }
  if (vitals.consciousness && ['Sopor', 'Koma'].includes(vitals.consciousness)) {
    reasons.push(`Penurunan kesadaran (${vitals.consciousness})`);
  }
  if (
    lowerComplaint.includes('henti napas') ||
    lowerComplaint.includes('henti jantung') ||
    lowerComplaint.includes('kejang terus') ||
    lowerComplaint.includes('pingsan tidak sadar') ||
    lowerComplaint.includes('tersedak total')
  ) {
    reasons.push('Keluhan utama mengancam kelangsungan hidup');
  }

  if (reasons.length > 0) {
    return {
      category: 'P1',
      reason: reasons.join('; '),
      priorityScore: 100 + reasons.length * 10,
    };
  }

  // Urgent indicators for P2 (Kuning)
  const p2Reasons: string[] = [];
  if (vitals.oxygenSaturation !== undefined && vitals.oxygenSaturation >= 90 && vitals.oxygenSaturation < 95) {
    p2Reasons.push(`Saturasi O2 rendah (${vitals.oxygenSaturation}%)`);
  }
  if (vitals.respiratoryRate !== undefined && vitals.respiratoryRate >= 26 && vitals.respiratoryRate <= 35) {
    p2Reasons.push(`Takipnea (${vitals.respiratoryRate} x/mnt)`);
  }
  if (vitals.heartRate !== undefined && vitals.heartRate >= 110 && vitals.heartRate <= 140) {
    p2Reasons.push(`Takikardia (${vitals.heartRate} bpm)`);
  }
  if (vitals.temperature !== undefined && vitals.temperature >= 39.5) {
    p2Reasons.push(`Hiperpireksia (${vitals.temperature}°C)`);
  }
  if (vitals.systolic !== undefined && vitals.systolic >= 180) {
    p2Reasons.push(`Krisis hipertensi (${vitals.systolic} mmHg)`);
  }
  if (vitals.painScale !== undefined && vitals.painScale >= 7) {
    p2Reasons.push(`Skala nyeri berat (${vitals.painScale}/10)`);
  }
  if (vitals.consciousness && ['Apatis', 'Somnolen'].includes(vitals.consciousness)) {
    p2Reasons.push(`Kesadaran menurun ringan (${vitals.consciousness})`);
  }
  if (
    lowerComplaint.includes('patah tulang') ||
    lowerComplaint.includes('luka robek dalam') ||
    lowerComplaint.includes('muntah berulang') ||
    lowerComplaint.includes('nyeri dada') ||
    lowerComplaint.includes('perdarahan')
  ) {
    p2Reasons.push('Kondisi urgent berpotensi perburukan');
  }

  if (p2Reasons.length > 0) {
    return {
      category: 'P2',
      reason: p2Reasons.join('; '),
      priorityScore: 50 + p2Reasons.length * 5,
    };
  }

  // Stable indicator for P3 (Hijau)
  return {
    category: 'P3',
    reason: 'Tanda-tanda vital stabil, keluhan ringan dapat menunggu',
    priorityScore: 10,
  };
}

/**
 * Calculate Bed Occupancy Rate (BOR) percentage
 */
export function calculateBedOccupancyRate(beds: Bed[]): number {
  if (beds.length === 0) return 0;
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
  return Math.round((occupiedCount / beds.length) * 100);
}

/**
 * Automatically find the most suitable available bed for the patient
 */
export function getRecommendedBed(triage: TriageCategory, beds: Bed[]): Bed | undefined {
  const availableBeds = beds.filter((b) => b.status === 'available');
  if (availableBeds.length === 0) return undefined;

  if (triage === 'P1') {
    // Prefer Resusitasi with oxygen and monitor
    const resusBed = availableBeds.find((b) => b.category === 'resusitasi');
    if (resusBed) return resusBed;
    // Fallback to any bed with oxygen and monitor
    const equipped = availableBeds.find((b) => b.oxygenEquipped && b.monitorEquipped);
    if (equipped) return equipped;
  }

  if (triage === 'P2') {
    // Prefer Tindakan or Maternal or Umum
    const tindakanBed = availableBeds.find((b) => b.category === 'tindakan');
    if (tindakanBed) return tindakanBed;
  }

  // Default to any available bed
  return availableBeds[0];
}

/**
 * Calculate minutes elapsed since registration or between two dates
 */
export function getMinutesElapsed(startTimeIso: string, endTimeIso?: string): number {
  const start = new Date(startTimeIso).getTime();
  const end = endTimeIso ? new Date(endTimeIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Check if the patient response time exceeded standard target
 */
export function getResponseTimeStatus(
  registeredAt: string,
  triage: TriageCategory,
  attendedAt?: string
): { isDelayed: boolean; minutesElapsed: number; targetMinutes: number } {
  const minutesElapsed = getMinutesElapsed(registeredAt, attendedAt);
  const targetMinutes = TRIAGE_TARGET_MINUTES[triage];
  const isDelayed = minutesElapsed > targetMinutes;
  return { isDelayed, minutesElapsed, targetMinutes };
}
