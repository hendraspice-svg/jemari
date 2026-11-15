import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  UserPlus, 
  FileEdit, 
  Sparkles, 
  AlertCircle,
  Calendar,
  Building,
  CreditCard,
  Stethoscope
} from 'lucide-react';
import {
  KategoriPembayaran,
  PatientRecord,
  StatusKeluarIGD,
  TriageCategory,
  WANAREJA_II_VILLAGES,
  DAFTAR_TINDAKAN_MEDIS_UMUM,
  DAFTAR_DIAGNOSA_MEDIS,
} from '../types/index';

interface RegisterPatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PatientRecord) => void;
  editingRecord?: PatientRecord | null;
  totalRecordsCount: number;
}


export const RegisterPatientFormModal: React.FC<RegisterPatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
  totalRecordsCount,
}) => {
  const now = new Date();
  const defaultHour = String(now.getHours()).padStart(2, '0');
  const defaultMin = String(now.getMinutes()).padStart(2, '0');
  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().slice(0, 10));
  const [jamMasuk, setJamMasuk] = useState(`${defaultHour}:${defaultMin}`);
  const [nik, setNik] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [umur, setUmur] = useState<number | ''>('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [desa, setDesa] = useState<string>(WANAREJA_II_VILLAGES[0]);
  const [rt, setRt] = useState('01');
  const [rw, setRw] = useState('01');
  const [diagnosa, setDiagnosa] = useState<string>('');
  const [tindakanMedisUmum, setTindakanMedisUmum] = useState('');
  const [kategoriPembayaran, setKategoriPembayaran] = useState<KategoriPembayaran>('BPJS');
  const [statusKeluar, setStatusKeluar] = useState<StatusKeluarIGD>('Pulang Rawat Jalan');
  const [triage, setTriage] = useState<TriageCategory>('P3');
  const [dokterJaga, setDokterJaga] = useState('dr. Hendra Prasetyo');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingRecord) {
      setTanggalMasuk(editingRecord.tanggalMasuk);
      setJamMasuk(editingRecord.jamMasuk ? editingRecord.jamMasuk.replace('.', ':') : '08:00');
      setNik(editingRecord.nik);
      setNamaPasien(editingRecord.namaPasien);
      setUmur(editingRecord.umur);
      setJenisKelamin(editingRecord.jenisKelamin);
      setDesa(editingRecord.alamat.desa);
      setRt(editingRecord.alamat.rt);
      setRw(editingRecord.alamat.rw);
      setDiagnosa(editingRecord.diagnosa || '');
      setTindakanMedisUmum(editingRecord.tindakanMedisUmum);
      setKategoriPembayaran(editingRecord.kategoriPembayaran);
      setStatusKeluar(editingRecord.statusKeluar);
      setTriage(editingRecord.triage);
      setDokterJaga(editingRecord.dokterJaga || 'dr. Hendra Prasetyo');
    } else {
      const cur = new Date();
      const hh = String(cur.getHours()).padStart(2, '0');
      const mm = String(cur.getMinutes()).padStart(2, '0');
      setTanggalMasuk(new Date().toISOString().slice(0, 10));
      setJamMasuk(`${hh}:${mm}`);
      setNik('');
      setNamaPasien('');
      setUmur('');
      setJenisKelamin('L');
      setDesa(WANAREJA_II_VILLAGES[0]);
      setRt('01');
      setRw('01');
      setDiagnosa('');
      setTindakanMedisUmum('');
      setKategoriPembayaran('BPJS');
      setStatusKeluar('Pulang Rawat Jalan');
      setTriage('P3');
      setDokterJaga('dr. Hendra Prasetyo');
    }
    setErrorMsg('');
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleToggleTindakan = (act: string) => {
    if (!tindakanMedisUmum.trim()) {
      setTindakanMedisUmum(act);
      return;
    }
    const currentList = tindakanMedisUmum
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (currentList.includes(act)) {
      const updated = currentList.filter((s) => s !== act);
      setTindakanMedisUmum(updated.join(', '));
    } else {
      setTindakanMedisUmum([...currentList, act].join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPasien.trim()) {
      setErrorMsg('Nama Pasien wajib diisi!');
      return;
    }
    if (umur === '' || Number(umur) < 0) {
      setErrorMsg('Umur pasien wajib diisi dengan benar!');
      return;
    }
    if (!tindakanMedisUmum.trim()) {
      setErrorMsg('Tindakan Medis Umum wajib diisi!');
      return;
    }

    const finalNik = editingRecord
      ? nik.trim()
      : nik.trim() || `330104${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const isRawatInap = statusKeluar === 'Rawat Inap Puskesmas';
    const savedRecord: PatientRecord = {
      id: editingRecord ? editingRecord.id : `rec-${Date.now()}`,
      no: editingRecord ? editingRecord.no : totalRecordsCount + 1,
      tanggalMasuk,
      jamMasuk,
      nik: finalNik,
      noRm: editingRecord ? editingRecord.noRm : '',
      statusKeluar,
      namaPasien: namaPasien.trim(),
      umur: Number(umur),
      umurLabel: editingRecord?.umurLabel,
      jenisKelamin,
      alamat: {
        desa,
        rt: rt.trim() ? rt.trim().padStart(2, '0') : '',
        rw: rw.trim() ? rw.trim().padStart(2, '0') : '',
      },
      diagnosa: diagnosa.trim() || undefined,
      tindakanMedisUmum: tindakanMedisUmum.trim(),
      kategoriPembayaran,
      tanggalKeluar: isRawatInap ? editingRecord?.tanggalKeluar : undefined,
      jamKeluar: isRawatInap ? editingRecord?.jamKeluar : undefined,
      jumlahHariRawatManual: isRawatInap ? editingRecord?.jumlahHariRawatManual : undefined,
      statusPulangRanap: isRawatInap ? editingRecord?.statusPulangRanap || 'Masih Dirawat' : undefined,
      triage,
      dokterJaga,
      excludeFromIgd: editingRecord?.excludeFromIgd,
      excludeFromRanap: editingRecord?.excludeFromRanap,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#48c78e] text-slate-950 p-4 sm:p-5 flex items-center justify-between border-b-2 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-[#48c78e]">
              {editingRecord ? <FileEdit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {editingRecord ? 'Ubah Data Registrasi Pasien IGD' : 'Formulir Registrasi Pasien Baru IGD'}
              </h2>
              <p className="text-xs text-slate-800 font-medium">
                PUSKESMAS WANAREJA II • Sesuai Standar Format Buku Register Pasien IGD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Formulir"
            className="p-1.5 rounded-lg text-slate-800 hover:text-black hover:bg-black/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Tanggal & Jam Masuk IGD & NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal Masuk IGD <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                aria-label="Tanggal Masuk IGD"
                value={tanggalMasuk}
                onChange={(e) => setTanggalMasuk(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jam Masuk IGD (WIB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                aria-label="Jam Masuk IGD (WIB)"
                value={jamMasuk}
                onChange={(e) => setJamMasuk(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                NIK Pasien (16 Digit)
              </label>
              <input
                type="text"
                maxLength={16}
                placeholder="16 Digit NIK KTP"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Section 2: Data Identitas (Nama, Umur, Jenis Kelamin) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Pasien <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bpk. Ahmad Subandi"
                value={namaPasien}
                onChange={(e) => setNamaPasien(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Umur (Tahun) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="120"
                required
                placeholder="Tahun"
                value={umur}
                onChange={(e) => setUmur(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Alamat (Desa, RT, RW) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-teal-700" />
              Alamat Domisili Pasien
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Desa Wilayah Puskesmas Wanareja II
                </label>
                <select
                  value={desa}
                  onChange={(e) => setDesa(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {WANAREJA_II_VILLAGES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  RT (Rukun Tetangga)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="01"
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  RW (Rukun Warga)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="01"
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Diagnosa Medis (ICD-10) */}
          <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Diagnosa Medis (Opsional di IGD • {DAFTAR_DIAGNOSA_MEDIS.length} Standar ICD-10)
              </label>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                Terintegrasi Rekap Ranap
              </span>
            </div>
            <select
              aria-label="Diagnosa Medis ICD-10"
              value={
                diagnosa === ''
                  ? ''
                  : DAFTAR_DIAGNOSA_MEDIS.includes(diagnosa as (typeof DAFTAR_DIAGNOSA_MEDIS)[number])
                  ? diagnosa
                  : '__custom__'
              }
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  setDiagnosa(e.target.value);
                }
              }}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 font-semibold"
            >
              <option value="">-- Belum Diisi (Dapat dilengkapi di Register Rawat Inap) --</option>
              {DAFTAR_DIAGNOSA_MEDIS.map((d, idx) => (
                <option key={d} value={d}>
                  {idx + 1}. {d}
                </option>
              ))}
              {diagnosa !== '' &&
                !DAFTAR_DIAGNOSA_MEDIS.includes(diagnosa as (typeof DAFTAR_DIAGNOSA_MEDIS)[number]) && (
                  <option value="__custom__">Lainnya: {diagnosa}</option>
                )}
            </select>
          </div>

          {/* Section 5: Tindakan Medis Umum */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                  <span>Tindakan Medis Umum</span>
                  <span className="text-rose-500">*</span>
                </span>
              </label>
              <span className="text-[10px] text-teal-800 font-bold bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                21 Pilihan Standar
              </span>
            </div>

            {/* Dropdown Quick Selector */}
            <div className="flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleToggleTindakan(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="">-- Tambah / Pilih dari 21 Tindakan Medis Umum --</option>
                {DAFTAR_TINDAKAN_MEDIS_UMUM.map((act, idx) => (
                  <option key={idx} value={act}>
                    {idx + 1}. {act}
                  </option>
                ))}
              </select>

              {tindakanMedisUmum && (
                <button
                  type="button"
                  onClick={() => setTindakanMedisUmum('')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  title="Hapus semua teks tindakan"
                >
                  Bersihkan
                </button>
              )}
            </div>

            {/* Textarea for detailed entries */}
            <textarea
              required
              rows={2}
              placeholder="Pilih dari daftar tindakan medis di bawah atau ketik rincian tindakan medis..."
              value={tindakanMedisUmum}
              onChange={(e) => setTindakanMedisUmum(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
            />

            {/* Quick Chips for all 21 choices */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-600 font-bold">
                  Daftar Pilihan Tindakan Medis Umum (Klik untuk memilih / menambah):
                </span>
                <span className="text-[10px] text-slate-500">
                  {tindakanMedisUmum ? tindakanMedisUmum.split(',').filter(Boolean).length : 0} dipilih
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                {DAFTAR_TINDAKAN_MEDIS_UMUM.map((act, idx) => {
                  const isSelected = tindakanMedisUmum.includes(act);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleToggleTindakan(act)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-teal-400 text-slate-700 hover:bg-teal-50/50'
                      }`}
                      title={act}
                    >
                      <span className="font-bold">{isSelected ? '✓' : '+'}</span>
                      <span>{act}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 6: Kategori Pembayaran & Status Keluar IGD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kategori Pembayaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategoriPembayaran}
                onChange={(e) => setKategoriPembayaran(e.target.value as KategoriPembayaran)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="BPJS">BPJS</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Status Keluar IGD <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Status Keluar IGD"
                value={statusKeluar}
                onChange={(e) => setStatusKeluar(e.target.value as StatusKeluarIGD)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Pulang Rawat Jalan">Pulang Rawat Jalan</option>
                <option value="Rawat Inap Puskesmas">Rawat Inap Puskesmas</option>
                <option value="Rujuk RSUD / RS Lanjutan">Rujuk RSUD / RS Lanjutan</option>
                <option value="Pulang APS (Permintaan Sendiri)">Pulang APS (Permintaan Sendiri)</option>
                <option value="Meninggal Dunia">Meninggal Dunia</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kategori Triage
              </label>
              <select
                value={triage}
                onChange={(e) => setTriage(e.target.value as TriageCategory)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-bold"
              >
                <option value="P1">P1 - Merah (Resusitasi Cito)</option>
                <option value="P2">P2 - Kuning (Urgent / Darurat)</option>
                <option value="P3">P3 - Hijau (Non-Urgent)</option>
                <option value="P0">P0 - Hitam (DOA)</option>
              </select>
            </div>
          </div>

          {/* Section 7: Otomatis Integrasi ke Register Rawat Inap */}
          {statusKeluar === 'Rawat Inap Puskesmas' && (
            <div className="bg-[#cfe2ff]/60 p-3.5 rounded-xl border border-sky-400">
              <div className="flex items-start gap-2.5 text-xs text-sky-950 bg-white/85 p-3 rounded-lg border border-sky-200">
                <Sparkles className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Otomatis Terekap ke Register Rawat Inap:</span>{' '}
                  Identitas pasien, alamat, tanggal &amp; jam masuk IGD, kategori pembayaran, dan NIK langsung masuk ke{' '}
                  <strong>Rekap Perawatan Rawat Inap</strong>. Di menu Rawat Inap, cukup melengkapi data tambahan:{' '}
                  <strong>Diagnosa, Tanggal &amp; Jam Pulang, Jumlah Hari Rawat, dan Status Pulang</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingRecord ? 'Simpan Perubahan' : 'Simpan ke Buku Register'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
