import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Edit3,
  RotateCcw,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  DAFTAR_DIAGNOSA_MEDIS,
  PatientRecord,
  StatusPulangRanap,
} from '../types/index';
import { calculateLengthOfStay } from '../utils/recap';

interface RawatInapUpdateModalProps {
  record: PatientRecord | null;
  onClose: () => void;
  onSave: (updatedRecord: PatientRecord) => void;
  onOpenFullIgdEdit: (record: PatientRecord) => void;
}

const STATUS_PULANG_OPTIONS: StatusPulangRanap[] = [
  'Masih Dirawat',
  'Pulang Sehat / Sembuh',
  'Pulang Perbaikan',
  'Rujuk RSUD / RS Lanjutan',
  'Pulang APS',
  'Meninggal Dunia',
];

export const RawatInapUpdateModal: React.FC<RawatInapUpdateModalProps> = ({
  record,
  onClose,
  onSave,
  onOpenFullIgdEdit,
}) => {
  const [diagnosa, setDiagnosa] = useState<string>('');
  const [tanggalKeluar, setTanggalKeluar] = useState<string>('');
  const [jamKeluar, setJamKeluar] = useState<string>('');
  const [jumlahHariRawat, setJumlahHariRawat] = useState<number>(1);
  const [isManualDays, setIsManualDays] = useState<boolean>(false);
  const [statusPulang, setStatusPulang] = useState<StatusPulangRanap>('Masih Dirawat');

  useEffect(() => {
    if (!record) return;
    const rawDiag = (record.diagnosa || '').trim();
    setDiagnosa(rawDiag && rawDiag !== 'Belum Dilengkapi' ? rawDiag : DAFTAR_DIAGNOSA_MEDIS[0]);
    setTanggalKeluar(record.tanggalKeluar || '');
    setJamKeluar(record.jamKeluar || '');
    setStatusPulang(
      record.statusPulangRanap || (record.tanggalKeluar ? 'Pulang Sehat / Sembuh' : 'Masih Dirawat')
    );

    if (typeof record.jumlahHariRawatManual === 'number' && record.jumlahHariRawatManual >= 0) {
      setJumlahHariRawat(record.jumlahHariRawatManual);
      setIsManualDays(true);
    } else {
      setJumlahHariRawat(calculateLengthOfStay(record.tanggalMasuk, record.tanggalKeluar));
      setIsManualDays(false);
    }
  }, [record]);

  if (!record) return null;

  const autoDays = calculateLengthOfStay(record.tanggalMasuk, tanggalKeluar || undefined);

  const handleTanggalKeluarChange = (nextDate: string) => {
    setTanggalKeluar(nextDate);
    if (nextDate && statusPulang === 'Masih Dirawat') {
      setStatusPulang('Pulang Sehat / Sembuh');
    }
    if (!isManualDays) {
      setJumlahHariRawat(calculateLengthOfStay(record.tanggalMasuk, nextDate || undefined));
    }
  };

  const handleStatusPulangChange = (nextStatus: StatusPulangRanap) => {
    setStatusPulang(nextStatus);
    if (nextStatus === 'Masih Dirawat') {
      setTanggalKeluar('');
      setJamKeluar('');
      if (!isManualDays) {
        setJumlahHariRawat(calculateLengthOfStay(record.tanggalMasuk, undefined));
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const effectiveDate = tanggalKeluar || today;
      if (!tanggalKeluar) setTanggalKeluar(today);
      if (!jamKeluar) setJamKeluar(curTime);
      if (!isManualDays) {
        setJumlahHariRawat(calculateLengthOfStay(record.tanggalMasuk, effectiveDate));
      }
    }
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    handleTanggalKeluarChange(today);
  };

  const handleSetNow = () => {
    const now = new Date();
    setJamKeluar(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PatientRecord = {
      ...record,
      diagnosa: diagnosa.trim() || DAFTAR_DIAGNOSA_MEDIS[0],
      tanggalKeluar: statusPulang === 'Masih Dirawat' ? undefined : tanggalKeluar || undefined,
      jamKeluar: statusPulang === 'Masih Dirawat' ? undefined : jamKeluar || undefined,
      jumlahHariRawatManual: isManualDays ? Math.max(0, Number(jumlahHariRawat) || 0) : undefined,
      statusPulangRanap: statusPulang,
    };
    onSave(updated);
    onClose();
  };

  const isStdDiagnosa = DAFTAR_DIAGNOSA_MEDIS.includes(
    diagnosa as (typeof DAFTAR_DIAGNOSA_MEDIS)[number]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#cfe2ff] text-slate-950 p-4 sm:p-5 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-sky-300">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Lengkapi Data Perawatan Rawat Inap
              </h2>
              <p className="text-xs text-slate-700 font-medium">
                Data identitas &amp; masuk otomatis dari Register IGD • Lengkapi Diagnosa, Waktu Pulang, Hari Rawat &amp; Status Pulang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal Rawat Inap"
            className="p-1.5 rounded-lg text-slate-800 hover:text-black hover:bg-black/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Read-only Auto-Synced IGD Summary Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                Otomatis Tersinkronisasi dari Register IGD
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullIgdEdit(record);
                }}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah Biodata IGD Lengkap</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {record.noRm ? 'Nama Pasien / No. RM' : 'Nama Pasien'}
                </span>
                <span className="font-bold text-slate-900">
                  {record.namaPasien}
                  {record.noRm && (
                    <span className="font-mono font-normal text-slate-500"> ({record.noRm})</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Umur / Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">
                  {record.umurLabel || `${record.umur} tahun`} /{' '}
                  {record.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Kategori Pembayaran / NIK</span>
                <span className="font-semibold text-slate-800">
                  {record.kategoriPembayaran} •{' '}
                  <span className="font-mono text-[11px]">{record.nik || '-'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Alamat (Desa / RT / RW)</span>
                <span className="font-medium text-slate-800">
                  {record.alamat.desa}, RT {record.alamat.rt || '-'} / RW {record.alamat.rw || '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Masuk IGD / Ranap</span>
                <span className="font-mono font-semibold text-slate-900">
                  {record.tanggalMasuk} ({record.jamMasuk || '-'} WIB)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Tindakan Awal IGD</span>
                <span className="text-slate-700 line-clamp-1" title={record.tindakanMedisUmum}>
                  {record.tindakanMedisUmum}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Diagnosa Medis */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
              <span>1. Diagnosa Medis ({DAFTAR_DIAGNOSA_MEDIS.length} Standar ICD-10 Rawat Inap)</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              aria-label="Diagnosa Rawat Inap"
              value={isStdDiagnosa ? diagnosa : '__custom__'}
              onChange={(e) => {
                if (e.target.value !== '__custom__') {
                  setDiagnosa(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
            >
              {DAFTAR_DIAGNOSA_MEDIS.map((d, idx) => (
                <option key={d} value={d}>
                  {idx + 1}. {d}
                </option>
              ))}
              {!isStdDiagnosa && <option value="__custom__">Lainnya: {diagnosa}</option>}
            </select>
          </div>

          {/* 2 & 3. Tanggal Pulang & Jam Pulang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-sky-700" />
                  <span>2. Tanggal Keluar / Pulang</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[10px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 cursor-pointer"
                >
                  Hari Ini
                </button>
              </div>
              <input
                type="date"
                aria-label="Tanggal Keluar / Pulang"
                value={tanggalKeluar}
                onChange={(e) => handleTanggalKeluarChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-700" />
                  <span>3. Jam Keluar / Pulang (WIB)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetNow}
                  className="text-[10px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 cursor-pointer"
                >
                  Sekarang
                </button>
              </div>
              <input
                type="time"
                aria-label="Jam Keluar / Pulang"
                value={jamKeluar}
                onChange={(e) => setJamKeluar(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 4 & 5. Jumlah Hari Rawat & Status Pulang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  4. Jumlah Hari Rawat (Hari)
                </label>
                {isManualDays && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualDays(false);
                      setJumlahHariRawat(autoDays);
                    }}
                    className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 cursor-pointer"
                    title="Kembalikan ke hitungan otomatis dari tanggal masuk & keluar"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Otomatis ({autoDays} hr)</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={365}
                  aria-label="Jumlah Hari Rawat"
                  value={jumlahHariRawat}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value || '0', 10));
                    setJumlahHariRawat(val);
                    setIsManualDays(val !== autoDays);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-500 shrink-0">
                  {isManualDays ? 'Manual' : 'Otomatis'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                5. Status Pulang Rawat Inap <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Status Pulang Rawat Inap"
                value={statusPulang}
                onChange={(e) => handleStatusPulangChange(e.target.value as StatusPulangRanap)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                {STATUS_PULANG_OPTIONS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Data Rawat Inap</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
