export type TriageCategory = 'P1' | 'P2' | 'P3' | 'P0';

export type StatusKeluarIGD = 
  | 'Pulang Rawat Jalan'
  | 'Rawat Inap Puskesmas'
  | 'Rujuk RSUD / RS Lanjutan'
  | 'Pulang APS (Permintaan Sendiri)'
  | 'Meninggal Dunia';

export type KategoriPembayaran = 'BPJS' | 'Umum';

export const KATEGORI_PEMBAYARAN_OPTIONS: KategoriPembayaran[] = ['BPJS', 'Umum'];

export const WANAREJA_II_VILLAGES = [
  'Purwasari',
  'Cilongkrang',
  'Tarisi',
  'Bantar',
  'Sidamulya',
  'Adimulya',
  'Luar Wilayah',
] as const;

export type NamaDesa = typeof WANAREJA_II_VILLAGES[number];

export const DAFTAR_TINDAKAN_MEDIS_UMUM = [
  'Anamnesis',
  'EKG',
  'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)',
  'Injeksi',
  'Insisi Abses dll',
  'Jahit/ Lepas Jahit Luka',
  'Nebulizer',
  'Observasi',
  'Pasang Infus',
  'Pasang Kateter',
  'Perawatan Luka, Ganti Balut',
  'Pemasangan Bidai',
  'Pemberian Oksigen',
  'Pemeriksaan Laboratorium Sederhana',
  'Penatalaksanaan Kecelakaan Lalu Lintas (KLL)',
  'Penatalaksanaan Penyakit Jantung',
  'Penatalaksanaan Digigit Ular (Snake Bite)',
  'Penatalaksanaan Tersengat/ Digigit Serangga',
  'Reposisi Dislokasi',
  'Resusitasi Jantung Paru (RJP)',
  'Stabilisasi Pasien Gawat Darurat',
] as const;

export type TindakanMedisUmum = typeof DAFTAR_TINDAKAN_MEDIS_UMUM[number];

export const DAFTAR_DIAGNOSA_MEDIS = [
  'Febris/ Demam - R50',
  'Vomitus - R11',
  'Cephalgia/ Sakit Kepala - R51',
  'Vertigo - R42/ H81.9',
  'Gastritis/ Dispepsia - K29.7',
  'GEA + Diare tanpa dehidrasi - A09',
  'GEA + Dehidrasi Ringan-sedang - A09 + E86',
  'Demam Tifoid - A01.0',
  'Dengue/ DBD - A91',
  'ISPA/ ISPA Atas - J06.9',
  'Pneumonia - J18.9',
  'Melena - K92.1',
  'Quadriplegia/ Tetraparesis - G82.50',
  'Stroke, not specified - I64',
  'Hypertensive Heart Disease / HHD - I11',
  'Orchitis (Peradangan testis yang terisolasi) - N45.2',
  'Chest Pain - R07.4',
  'Hipertensi Esensial - I10',
  'TBC - A15',
  'Asma Bronkial - J45.9',
  'Diabetes Melitus Tipe 2 - E11.9',
  'Envenomation Snake Bite - T63.0 + X23',
  'Other disorders of urinary system - N39',
] as const;

export type DiagnosaMedis = typeof DAFTAR_DIAGNOSA_MEDIS[number];

export type StatusPulangRanap =
  | 'Masih Dirawat'
  | 'Pulang Sehat / Sembuh'
  | 'Pulang Perbaikan'
  | 'Rujuk RSUD / RS Lanjutan'
  | 'Pulang APS'
  | 'Meninggal Dunia';

export interface AlamatPasien {
  desa: NamaDesa | string;
  rt: string;
  rw: string;
}

export interface PatientRecord {
  id: string;
  no: number;
  tanggalMasuk: string; // YYYY-MM-DD or ISO
  jamMasuk?: string;    // HH:mm
  nik: string;
  noRm: string;
  statusKeluar: StatusKeluarIGD;
  namaPasien: string;
  umur: number;
  umurLabel?: string;
  jenisKelamin: 'L' | 'P';
  alamat: AlamatPasien;
  tindakanMedisUmum: string;
  kategoriPembayaran: KategoriPembayaran;
  // Inpatient (Rawat Inap) & Diagnosis fields
  diagnosa?: string;
  tanggalKeluar?: string; // YYYY-MM-DD
  jamKeluar?: string;     // HH:mm
  jumlahHariRawatManual?: number;
  statusPulangRanap?: StatusPulangRanap;
  // Sheet separation flags for historical imported registers
  excludeFromIgd?: boolean;
  excludeFromRanap?: boolean;
  // Additional emergency support data
  triage: TriageCategory;
  keluhanUtama?: string;
  dokterJaga?: string;
  bedId?: string;
}

export type PatientStatus = 
  | 'triage'
  | 'tindakan'
  | 'observasi'
  | 'disposisi'
  | 'selesai';

export type DispositionType = 
  | 'rawat_jalan'
  | 'rawat_inap'
  | 'rujuk_rs'
  | 'meninggal'
  | 'aps';

export type BedStatus = 'available' | 'occupied' | 'cleaning';

export type BedCategory = 'resusitasi' | 'tindakan' | 'maternal' | 'umum' | 'isolasi';

export interface Bed {
  id: string;
  name: string;
  category: BedCategory;
  categoryLabel: string;
  status: BedStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  triage?: TriageCategory;
  occupiedSince?: string;
  oxygenEquipped: boolean;
  monitorEquipped: boolean;
}

export interface VitalSigns {
  systolic: number;     // mmHg
  diastolic: number;    // mmHg
  heartRate: number;    // bpm
  respiratoryRate: number; // x/menit
  temperature: number;  // °C
  oxygenSaturation: number; // %
  painScale: number;    // 0 - 10
  gcs: string;          // E4V5M6 (15)
  consciousness: 'Compos Mentis' | 'Apatis' | 'Somnolen' | 'Sopor' | 'Koma';
}

export interface PatientTrack {
  id: string;
  registrationNumber: string; // e.g. IGD-20261110-001
  medicalRecordNumber: string; // e.g. RM-084219
  nik: string;
  fullName: string;
  birthDate: string;
  age: number;
  gender: 'L' | 'P';
  phone: string;
  addressVillage: string;
  rtRw: string;
  arrivalMethod: 'Sendiri' | 'Keluarga' | 'Bidan Desa' | 'Rujukan Bidan Desa' | 'Kader Posyandu' | 'Rujukan Kader Posyandu' | 'Ambulans Siaga Desa';
  insurance: 'BPJS' | 'Umum';
  chiefComplaint: string;
  triage: TriageCategory;
  triageReason: string;
  vitals: VitalSigns;
  bedId?: string;
  status: PatientStatus;
  registeredAt: string; // ISO string
  triageCompletedAt?: string;
  doctorExamStartedAt?: string;
  observationStartedAt?: string;
  dispositionAt?: string;
  dispositionType?: DispositionType;
  dispositionDestination?: string;
  doctorInCharge: string;
  nurseInCharge: string;
  notes: string[];
}

export interface VillageCoverage {
  name: string;
  distanceKm: number;
  estimatedArrivalMin: number;
  activeCases: number;
  totalMonthlyCases: number;
  contactKader: string;
}
