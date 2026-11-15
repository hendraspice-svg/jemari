import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit3,
  Calendar,
  BedDouble,
  ArrowRight,
} from 'lucide-react';
import {
  PatientRecord,
  KategoriPembayaran,
  StatusPulangRanap,
  DAFTAR_DIAGNOSA_MEDIS,
} from '../types/index';
import { aggregateRawatInapRecap, formatMonthLabel } from '../utils/recap';

interface RawatInapRegisterTableProps {
  records: PatientRecord[];
  onEditRecord: (record: PatientRecord) => void;
  onOpenRecapRawatInapSheet?: () => void;
  canManageRecords?: boolean;
}

const STATUS_PULANG_OPTIONS: StatusPulangRanap[] = [
  'Masih Dirawat',
  'Pulang Sehat / Sembuh',
  'Pulang Perbaikan',
  'Rujuk RSUD / RS Lanjutan',
  'Pulang APS',
  'Meninggal Dunia',
];

export const RawatInapRegisterTable: React.FC<RawatInapRegisterTableProps> = ({
  records,
  onEditRecord,
  onOpenRecapRawatInapSheet,
  canManageRecords = true,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [diagnosaFilter, setDiagnosaFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | KategoriPembayaran>('ALL');
  const [statusPulangFilter, setStatusPulangFilter] = useState<'ALL' | StatusPulangRanap>('ALL');

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

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return recap.items.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.namaPasien.toLowerCase().includes(q) ||
        item.nik.includes(q) ||
        item.diagnosa.toLowerCase().includes(q) ||
        item.desa.toLowerCase().includes(q);

      const matchesDiagnosa = diagnosaFilter === 'ALL' || item.diagnosa === diagnosaFilter;
      const matchesPayment = paymentFilter === 'ALL' || item.kategoriPembayaran === paymentFilter;
      const matchesStatusPulang =
        statusPulangFilter === 'ALL' || item.statusPulang === statusPulangFilter;

      return matchesSearch && matchesDiagnosa && matchesPayment && matchesStatusPulang;
    });
  }, [recap.items, searchQuery, diagnosaFilter, paymentFilter, statusPulangFilter]);

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Pasien',
      'Umur',
      'Jenis Kelamin',
      'Desa',
      'RT',
      'RW',
      'Diagnosa',
      'Masuk Tanggal',
      'Masuk Jam',
      'Keluar Tanggal',
      'Keluar Jam',
      'Jumlah Hari Rawat',
      'Kategori Pembayaran',
      'NIK',
      'Status Pulang',
    ];

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      `"${item.namaPasien}"`,
      item.record.umurLabel || item.umur,
      item.jenisKelamin,
      `"${item.desa}"`,
      item.rt || '-',
      item.rw || '-',
      `"${item.diagnosa.replace(/"/g, '""')}"`,
      item.masukTanggal,
      item.masukJam,
      item.keluarTanggal,
      item.keluarJam,
      item.jumlahHariRawat,
      `"${item.kategoriPembayaran}"`,
      item.nik ? `'${item.nik}` : '-',
      `"${item.statusPulang}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Register_Rawat_Inap_WANAREJA_II_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusPulangBadge = (status: StatusPulangRanap) => {
    switch (status) {
      case 'Masih Dirawat':
        return 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
      case 'Pulang Sehat / Sembuh':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'Pulang Perbaikan':
        return 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';
      case 'Rujuk RSUD / RS Lanjutan':
        return 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
      case 'Pulang APS':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'Meninggal Dunia':
        return 'bg-slate-900 text-white border-slate-700 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Info & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
              <BedDouble className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Register Pasien Rawat Inap</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-800 text-sky-100">
                  PUSKESMAS WANAREJA II
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data terintegrasi otomatis dari Register IGD (status keluar &ldquo;Rawat Inap Puskesmas&rdquo;). Gunakan ikon pensil untuk melengkapi Diagnosa ICD-10, Tanggal &amp; Jam Pulang, Jumlah Hari Rawat, dan Status Pulang.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Ekspor Register Rawat Inap ke Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak Register Rawat Inap"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            {onOpenRecapRawatInapSheet && (
              <button
                type="button"
                onClick={onOpenRecapRawatInapSheet}
                className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Grafik Rekap Ranap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Nama Pasien, NIK, Diagnosa ICD-10, atau Desa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-700" />
              Bulan:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-sky-700" />
            Filter:
          </span>

          <select
            value={diagnosaFilter}
            onChange={(e) => setDiagnosaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium max-w-[260px]"
          >
            <option value="ALL">Semua Diagnosa Medis ({DAFTAR_DIAGNOSA_MEDIS.length} ICD-10)</option>
            {DAFTAR_DIAGNOSA_MEDIS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | KategoriPembayaran)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="BPJS">BPJS</option>
            <option value="Umum">Umum</option>
          </select>

          <select
            value={statusPulangFilter}
            onChange={(e) => setStatusPulangFilter(e.target.value as 'ALL' | StatusPulangRanap)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-sky-500 font-medium"
          >
            <option value="ALL">Semua Status Pulang</option>
            {STATUS_PULANG_OPTIONS.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          <span className="ml-auto text-slate-500 font-mono">
            Menampilkan: <strong>{filteredItems.length}</strong> dari {recap.totalRanap} pasien rawat inap
          </span>
        </div>
      </div>

      {/* Pending Completion Notice for Auto-Recapped IGD Patients */}
      {canManageRecords && recap.belumLengkapCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
              {recap.belumLengkapCount} Baru dari IGD
            </span>
            <span>
              Pasien dari Register IGD otomatis masuk ke tabel ini. Klik ikon pensil (<strong>Lengkapi</strong>) untuk mengisi{' '}
              <strong>Diagnosa</strong>, <strong>Tanggal &amp; Jam Pulang</strong>, <strong>Jumlah Hari Rawat</strong>, dan <strong>Status Pulang</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Spreadsheet Table Matching Exact Layout Attachment */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
              Buku Register Pasien Rawat Inap
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-800 text-sky-100">
              PUSKESMAS WANAREJA II
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Format Resmi Register Rawat Inap Terintegrasi IGD &amp; ICD-10
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10.5px] border-collapse">
            <thead>
              {/* Row 1 of Merged Spreadsheet Header (#cfe2ff soft blue with black grid lines) */}
              <tr className="bg-[#cfe2ff] text-slate-950 font-bold text-center border-t border-b border-black">
                <th rowSpan={2} className="px-1 py-2 border-r border-black w-7">
                  No
                </th>
                <th rowSpan={2} className="px-1.5 py-2 border-r border-black min-w-[92px]">
                  Nama Pasien
                </th>
                <th rowSpan={2} className="px-1 py-2 border-r border-black w-10">
                  Umur
                </th>
                <th rowSpan={2} className="px-1 py-2 border-r border-black w-12 leading-tight">
                  Jenis Kelamin
                </th>
                <th colSpan={3} className="px-1.5 py-1 border-r border-black">
                  Alamat
                </th>
                <th rowSpan={2} className="px-1.5 py-2 border-r border-black min-w-[130px] max-w-[165px]">
                  Diagnosa
                </th>
                <th colSpan={2} className="px-1.5 py-1 border-r border-black">
                  Masuk
                </th>
                <th colSpan={2} className="px-1.5 py-1 border-r border-black">
                  Keluar
                </th>
                <th rowSpan={2} className="px-1 py-2 border-r border-black w-12 leading-tight">
                  Jumlah Hari Rawat
                </th>
                <th rowSpan={2} className="px-1 py-2 border-r border-black w-16 leading-tight">
                  Kategori Pembayaran
                </th>
                <th rowSpan={2} className="px-1.5 py-2 border-r border-black w-24">
                  NIK
                </th>
                <th rowSpan={2} className={`px-1.5 py-2 ${canManageRecords ? 'border-r border-black' : ''} min-w-[88px]`}>
                  Status Pulang
                </th>
                {canManageRecords && (
                  <th rowSpan={2} className="px-1 py-2 w-9 print:hidden">
                    Aksi
                  </th>
                )}
              </tr>

              {/* Row 2 of Sub-headers */}
              <tr className="bg-[#cfe2ff] text-slate-950 font-bold text-center border-b-2 border-black">
                <th className="px-1.5 py-1 border-r border-black">Desa</th>
                <th className="px-1 py-1 border-r border-black w-7">RT</th>
                <th className="px-1 py-1 border-r border-black w-7">RW</th>
                <th className="px-1 py-1 border-r border-black whitespace-nowrap">Tanggal</th>
                <th className="px-1 py-1 border-r border-black w-10">Jam</th>
                <th className="px-1 py-1 border-r border-black whitespace-nowrap">Tanggal</th>
                <th className="px-1 py-1 border-r border-black w-10">Jam</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canManageRecords ? 17 : 16} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada pasien rawat inap yang sesuai dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-sky-50/50 transition border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="px-1 py-1.5 text-center font-bold font-mono text-slate-700 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="px-1.5 py-1.5 font-bold text-slate-900 border-r border-slate-200">
                      <div className="leading-tight">{item.namaPasien}</div>
                      {item.record.noRm && (
                        <div className="text-[9.5px] font-mono text-slate-500 font-normal">
                          {item.record.noRm}
                        </div>
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono border-r border-slate-200 whitespace-nowrap">
                      {item.record.umurLabel || `${item.umur} th`}
                    </td>
                    <td className="px-1 py-1.5 text-center border-r border-slate-200">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.jenisKelamin === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {item.jenisKelamin === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 text-slate-800 font-medium border-r border-slate-200">
                      {item.desa}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-600 border-r border-slate-200">
                      {item.rt || '-'}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-600 border-r border-slate-200">
                      {item.rw || '-'}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-slate-200 max-w-[165px]">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded border font-semibold text-[9.5px] leading-tight ${
                          item.isDiagnosaIncomplete
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        {item.diagnosa}
                      </span>
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {item.masukTanggal}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {item.masukJam}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      {item.keluarTanggal === '-' ? (
                        <span className="text-[10px] italic text-sky-700 font-sans">Dirawat</span>
                      ) : (
                        item.keluarTanggal
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                      {item.keluarJam}
                    </td>
                    <td className="px-1 py-1.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      <span className="px-1 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px]">
                        {item.jumlahHariRawat} hr
                      </span>
                    </td>
                    <td className="px-1 py-1.5 text-center border-r border-slate-200">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] border ${
                          item.kategoriPembayaran === 'BPJS'
                            ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
                            : 'bg-sky-50 text-sky-800 border-sky-200 font-semibold'
                        }`}
                      >
                        {item.kategoriPembayaran}
                      </span>
                    </td>
                    <td className="px-1.5 py-1.5 font-mono text-[9.5px] text-teal-900 border-r border-slate-200 whitespace-nowrap">
                      {item.nik || '-'}
                    </td>
                    <td className={`px-1.5 py-1.5 text-center ${canManageRecords ? 'border-r border-slate-200' : ''}`}>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] leading-tight border ${getStatusPulangBadge(
                          item.statusPulang
                        )}`}
                      >
                        {item.statusPulang}
                      </span>
                    </td>
                    {canManageRecords && (
                      <td className="px-1 py-1.5 text-center print:hidden">
                        <button
                          onClick={() => onEditRecord(item.record)}
                          className={`p-1.5 rounded border inline-flex items-center justify-center transition cursor-pointer ${
                            item.isDiagnosaIncomplete
                              ? 'bg-amber-100 hover:bg-amber-600 text-amber-800 hover:text-white border-amber-300'
                              : 'bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border-sky-200'
                          }`}
                          title="Lengkapi Diagnosa, Waktu Pulang, Hari Rawat & Status Pulang"
                          aria-label={`Lengkapi data rawat inap ${item.namaPasien}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
