import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgeCategory,
  aggregateRecapDashboard,
  getLast7DaysTrend,
  calculateLengthOfStay,
  aggregateRawatInapRecap,
} from './recap';
import { selectMaleVoiceIndex } from './voice';
import { DAFTAR_DIAGNOSA_MEDIS, DAFTAR_TINDAKAN_MEDIS_UMUM, PatientRecord } from '../types/index';

test('getAgeCategory correctly classifies different age groups', () => {
  assert.equal(getAgeCategory(3), 'Balita (0-5 th)');
  assert.equal(getAgeCategory(5), 'Balita (0-5 th)');
  assert.equal(getAgeCategory(8), 'Anak (6-11 th)');
  assert.equal(getAgeCategory(15), 'Remaja (12-18 th)');
  assert.equal(getAgeCategory(42), 'Dewasa (19-59 th)');
  assert.equal(getAgeCategory(65), 'Lansia (60+ th)');
});

test('aggregateRecapDashboard accurately aggregates all table components', () => {
  const sampleRecords: PatientRecord[] = [
    {
      id: '1',
      no: 1,
      tanggalMasuk: '2026-11-10',
      nik: '3301041508680002',
      noRm: 'RM-048912',
      statusKeluar: 'Rujuk RSUD / RS Lanjutan',
      namaPasien: 'Sutrisno',
      umur: 58,
      jenisKelamin: 'L',
      alamat: { desa: 'Purwasari', rt: '03', rw: '02' },
      tindakanMedisUmum: 'O2 NRM 10 Lpm & Konsul Sp.JP',
      kategoriPembayaran: 'BPJS',
      triage: 'P1',
    },
    {
      id: '2',
      no: 2,
      tanggalMasuk: '2026-11-10',
      nik: '3301042403170001',
      noRm: 'RM-051280',
      statusKeluar: 'Pulang Rawat Jalan',
      namaPasien: 'Dimas Pratama',
      umur: 9,
      jenisKelamin: 'L',
      alamat: { desa: 'Cilongkrang', rt: '01', rw: '04' },
      tindakanMedisUmum: 'Hecting situasi 4 jahitan & Injeksi ATS',
      kategoriPembayaran: 'BPJS',
      triage: 'P2',
    },
    {
      id: '3',
      no: 3,
      tanggalMasuk: '2026-11-10',
      nik: '3301045211840003',
      noRm: 'RM-039824',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: 'Ratna Dewi',
      umur: 42,
      jenisKelamin: 'P',
      alamat: { desa: 'Tarisi', rt: '05', rw: '01' },
      tindakanMedisUmum: 'Infus RL & Injeksi Ondansetron',
      kategoriPembayaran: 'Umum',
      triage: 'P2',
    },
  ];

  const recap = aggregateRecapDashboard(sampleRecords);

  assert.equal(recap.totalPatients, 3);
  assert.equal(recap.gender.male, 2);
  assert.equal(recap.gender.female, 1);
  assert.equal(recap.gender.malePercent, 67);
  assert.equal(recap.gender.femalePercent, 33);

  // Status keluar
  assert.equal(recap.statusKeluar['Rujuk RSUD / RS Lanjutan'], 1);
  assert.equal(recap.statusKeluar['Pulang Rawat Jalan'], 1);
  assert.equal(recap.statusKeluar['Rawat Inap Puskesmas'], 1);
  assert.equal(recap.statusKeluar['Meninggal Dunia'], 0);

  // Kategori pembayaran
  assert.equal(recap.kategoriPembayaran['BPJS'], 2);
  assert.equal(recap.kategoriPembayaran['Umum'], 1);

  // Age groups
  assert.equal(recap.ageGroups['Anak (6-11 th)'], 1);
  assert.equal(recap.ageGroups['Dewasa (19-59 th)'], 2);

  // Desa
  assert.equal(recap.desa['Purwasari'], 1);
  assert.equal(recap.desa['Cilongkrang'], 1);
  assert.equal(recap.desa['Tarisi'], 1);
});

test('aggregateMonthlyRecaps groups records by month and generates trend data', () => {
  const multiMonthRecords: PatientRecord[] = [
    {
      id: 'm1',
      no: 1,
      tanggalMasuk: '2026-11-02',
      nik: '3301041111110001',
      noRm: 'RM-110001',
      statusKeluar: 'Pulang Rawat Jalan',
      namaPasien: 'Pasien Nov 1',
      umur: 30,
      jenisKelamin: 'L',
      alamat: { desa: 'Purwasari', rt: '01', rw: '01' },
      tindakanMedisUmum: 'Injeksi',
      kategoriPembayaran: 'BPJS',
      triage: 'P3',
    },
    {
      id: 'm2',
      no: 2,
      tanggalMasuk: '2026-11-05',
      nik: '3301041111110002',
      noRm: 'RM-110002',
      statusKeluar: 'Rujuk RSUD / RS Lanjutan',
      namaPasien: 'Pasien Nov 2',
      umur: 65,
      jenisKelamin: 'P',
      alamat: { desa: 'Bantar', rt: '02', rw: '02' },
      tindakanMedisUmum: 'Penatalaksanaan Penyakit Jantung',
      kategoriPembayaran: 'BPJS',
      triage: 'P1',
    },
    {
      id: 'm3',
      no: 3,
      tanggalMasuk: '2026-10-15',
      nik: '3301041010100001',
      noRm: 'RM-100001',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: 'Pasien Okt 1',
      umur: 45,
      jenisKelamin: 'L',
      alamat: { desa: 'Tarisi', rt: '03', rw: '01' },
      tindakanMedisUmum: 'Pasang Infus',
      kategoriPembayaran: 'Umum',
      triage: 'P2',
    },
  ];

  const result = aggregateRecapDashboard(multiMonthRecords, '2026-11');
  assert.equal(result.availableMonths.length, 2);
  assert.equal(result.availableMonths[0], '2026-11');
  assert.equal(result.availableMonths[1], '2026-10');

  // Filtered to November 2026
  assert.equal(result.totalPatients, 2);
  assert.equal(result.selectedMonthSummary?.totalPatients, 2);
  assert.equal(result.selectedMonthSummary?.label, 'November 2026');

  // Overall monthly trends
  assert.equal(result.monthlyTrends.length, 2);
  const novTrend = result.monthlyTrends.find((t) => t.monthKey === '2026-11');
  const oktTrend = result.monthlyTrends.find((t) => t.monthKey === '2026-10');
  assert.equal(novTrend?.total, 2);
  assert.equal(oktTrend?.total, 1);

  // All 21 standard procedures must appear in tindakanMedisAll
  assert.equal(result.tindakanMedisAll.length, DAFTAR_TINDAKAN_MEDIS_UMUM.length);
  assert.equal(result.tindakanMedisAll.length, 21);
});

test('getLast7DaysTrend returns exactly 7 consecutive days with accurate daily totals', () => {
  const records: PatientRecord[] = [
    {
      id: 'w1',
      no: 1,
      tanggalMasuk: '2026-11-08',
      nik: '3301040000000001',
      noRm: 'RM-01',
      statusKeluar: 'Pulang Rawat Jalan',
      namaPasien: 'A',
      umur: 20,
      jenisKelamin: 'L',
      alamat: { desa: 'Purwasari', rt: '01', rw: '01' },
      tindakanMedisUmum: 'Anamnesis',
      kategoriPembayaran: 'BPJS',
      triage: 'P3',
    },
    {
      id: 'w2',
      no: 2,
      tanggalMasuk: '2026-11-14',
      nik: '3301040000000002',
      noRm: 'RM-02',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: 'B',
      umur: 35,
      jenisKelamin: 'P',
      alamat: { desa: 'Tarisi', rt: '02', rw: '01' },
      tindakanMedisUmum: 'Pasang Infus',
      kategoriPembayaran: 'Umum',
      triage: 'P2',
    },
    {
      id: 'w3',
      no: 3,
      tanggalMasuk: '2026-11-14',
      nik: '3301040000000003',
      noRm: 'RM-03',
      statusKeluar: 'Rujuk RSUD / RS Lanjutan',
      namaPasien: 'C',
      umur: 60,
      jenisKelamin: 'L',
      alamat: { desa: 'Bantar', rt: '01', rw: '02' },
      tindakanMedisUmum: 'EKG',
      kategoriPembayaran: 'BPJS',
      triage: 'P1',
    },
  ];

  const trend = getLast7DaysTrend(records, '2026-11-14');
  assert.equal(trend.length, 7);
  assert.equal(trend[0].date, '2026-11-08');
  assert.equal(trend[0].total, 1);
  assert.equal(trend[6].date, '2026-11-14');
  assert.equal(trend[6].total, 2);
  assert.equal(trend[6].rawatInap, 1);
  assert.equal(trend[6].rujuk, 1);
  assert.equal(trend[3].total, 0);
});

test('calculateLengthOfStay and aggregateRawatInapRecap integrate inpatient records accurately', () => {
  assert.equal(calculateLengthOfStay('2026-11-10', '2026-11-10'), 1);
  assert.equal(calculateLengthOfStay('2026-11-10', '2026-11-13'), 3);
  assert.equal(calculateLengthOfStay('2026-11-11', undefined, '2026-11-14'), 3);

  const records: PatientRecord[] = [
    {
      id: 'r1',
      no: 1,
      tanggalMasuk: '2026-11-10',
      jamMasuk: '08:00',
      tanggalKeluar: '2026-11-12',
      jamKeluar: '10:30',
      nik: '3301040000000011',
      noRm: 'RM-101',
      statusKeluar: 'Rawat Inap Puskesmas',
      statusPulangRanap: 'Pulang Sehat / Sembuh',
      diagnosa: 'Dengue/ DBD - A91',
      namaPasien: 'Pasien Ranap 1',
      umur: 30,
      jenisKelamin: 'P',
      alamat: { desa: 'Tarisi', rt: '05', rw: '01' },
      tindakanMedisUmum: 'Pasang Infus',
      kategoriPembayaran: 'BPJS',
      triage: 'P2',
    },
    {
      id: 'r2',
      no: 2,
      tanggalMasuk: '2026-11-12',
      jamMasuk: '14:15',
      nik: '3301040000000012',
      noRm: 'RM-102',
      statusKeluar: 'Rawat Inap Puskesmas',
      statusPulangRanap: 'Masih Dirawat',
      diagnosa: 'Demam Tifoid - A01.0',
      namaPasien: 'Pasien Ranap 2',
      umur: 40,
      jenisKelamin: 'L',
      alamat: { desa: 'Purwasari', rt: '02', rw: '03' },
      tindakanMedisUmum: 'Pasang Infus, Injeksi',
      kategoriPembayaran: 'Umum',
      triage: 'P2',
    },
    {
      id: 'r3',
      no: 3,
      tanggalMasuk: '2026-11-12',
      nik: '3301040000000013',
      noRm: 'RM-103',
      statusKeluar: 'Pulang Rawat Jalan',
      diagnosa: 'ISPA/ ISPA Atas - J06.9',
      namaPasien: 'Pasien RJ',
      umur: 22,
      jenisKelamin: 'L',
      alamat: { desa: 'Bantar', rt: '01', rw: '01' },
      tindakanMedisUmum: 'Anamnesis',
      kategoriPembayaran: 'BPJS',
      triage: 'P3',
    },
  ];

  const ranap = aggregateRawatInapRecap(records, '2026-11', '2026-11-14');
  assert.equal(ranap.totalRanap, 2);
  assert.equal(ranap.masihDirawat, 1);
  assert.equal(ranap.sudahPulang, 1);
  assert.equal(ranap.totalHariRawat, 4); // 2 days + 2 days
  assert.equal(ranap.bpjsCount, 1);
  assert.equal(ranap.umumCount, 1);
  assert.equal(ranap.diagnosaCounts.length, DAFTAR_DIAGNOSA_MEDIS.length);
  assert.equal(DAFTAR_DIAGNOSA_MEDIS.length, 23);
  assert.ok(DAFTAR_DIAGNOSA_MEDIS.includes('Other disorders of urinary system - N39'));
  const n39 = ranap.diagnosaCounts.find((d) => d.diagnosa === 'Other disorders of urinary system - N39');
  assert.equal(n39?.count, 0);
  const dbd = ranap.diagnosaCounts.find((d) => d.diagnosa === 'Dengue/ DBD - A91');
  assert.equal(dbd?.count, 1);
});

test('selectMaleVoiceIndex prioritizes male Indonesian voices', () => {
  const voices = [
    { name: 'Microsoft Gadis Online (Natural) - Indonesian', lang: 'id-ID' },
    { name: 'Microsoft Ardi Online (Natural) - Indonesian', lang: 'id-ID' },
    { name: 'Google US English', lang: 'en-US' },
  ];
  assert.equal(selectMaleVoiceIndex(voices), 1);
});

test('aggregateRawatInapRecap marks newly auto-recapped IGD records without diagnosa and respects manual days override', () => {
  const records: PatientRecord[] = [
    {
      id: 'igd-auto-1',
      no: 1,
      tanggalMasuk: '2026-11-14',
      jamMasuk: '09:15',
      nik: '3301041234560001',
      noRm: 'RM-900001',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: 'Pasien Baru IGD',
      umur: 39,
      jenisKelamin: 'L',
      alamat: { desa: 'Purwasari', rt: '01', rw: '02' },
      tindakanMedisUmum: 'Pasang Infus',
      kategoriPembayaran: 'BPJS',
      triage: 'P2',
    },
    {
      id: 'igd-done-2',
      no: 2,
      tanggalMasuk: '2026-11-12',
      jamMasuk: '14:00',
      tanggalKeluar: '2026-11-14',
      jamKeluar: '11:00',
      jumlahHariRawatManual: 3,
      statusPulangRanap: 'Pulang Sehat / Sembuh',
      diagnosa: 'Pneumonia - J18.9',
      nik: '3301041234560002',
      noRm: 'RM-900002',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: 'Pasien Selesai Ranap',
      umur: 55,
      jenisKelamin: 'P',
      alamat: { desa: 'Tarisi', rt: '03', rw: '01' },
      tindakanMedisUmum: 'Pemberian Oksigen, Pasang Infus',
      kategoriPembayaran: 'Umum',
      triage: 'P2',
    },
  ];

  const summary = aggregateRawatInapRecap(records, '2026-11', '2026-11-14');
  assert.equal(summary.totalRanap, 2);
  assert.equal(summary.belumLengkapCount, 1);
  assert.equal(summary.items[0].diagnosa, 'Belum Dilengkapi');
  assert.equal(summary.items[0].isDiagnosaIncomplete, true);
  assert.equal(summary.items[0].statusPulang, 'Masih Dirawat');
  assert.equal(summary.items[1].jumlahHariRawat, 3);
  assert.equal(summary.totalHariRawat, 4);
});

test('INITIAL_PATIENT_RECORDS loads exact 367 IGD rows and 117 Rawat Inap rows from spreadsheets', async () => {
  const { INITIAL_PATIENT_RECORDS } = await import('../data/initialData');
  const igdRecords = INITIAL_PATIENT_RECORDS.filter((r) => !r.excludeFromIgd);
  assert.equal(igdRecords.length, 367);
  assert.equal(igdRecords[0].namaPasien, 'LASMINING PUTRI');
  assert.equal(igdRecords[0].tanggalMasuk, '2026-09-01');
  assert.equal(igdRecords[igdRecords.length - 1].namaPasien, 'SAMINGUN');
  assert.equal(igdRecords[igdRecords.length - 1].tanggalMasuk, '2026-11-15');

  const igdDashboard = aggregateRecapDashboard(INITIAL_PATIENT_RECORDS, 'ALL');
  assert.equal(igdDashboard.totalPatients, 367);
  assert.deepEqual(igdDashboard.availableMonths, ['2026-11', '2026-10', '2026-09']);

  const ranapSummary = aggregateRawatInapRecap(INITIAL_PATIENT_RECORDS, 'ALL', '2026-11-15');
  assert.equal(ranapSummary.totalRanap, 117);
  assert.equal(ranapSummary.items[0].namaPasien, 'SAMAN');
  assert.equal(ranapSummary.items[ranapSummary.items.length - 1].namaPasien, 'SAMINGUN');
  assert.equal(ranapSummary.masihDirawat, 7);
  assert.equal(ranapSummary.belumLengkapCount, 2);
  const n39 = ranapSummary.diagnosaCounts.find(
    (d) => d.diagnosa === 'Other disorders of urinary system - N39'
  );
  assert.equal(n39?.count, 1);
});




