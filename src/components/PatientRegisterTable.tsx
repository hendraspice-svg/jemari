import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Edit3, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { PatientRecord, StatusKeluarIGD, KategoriPembayaran, WANAREJA_II_VILLAGES, DAFTAR_TINDAKAN_MEDIS_UMUM } from '../types/index';

interface PatientRegisterTableProps {
  records: PatientRecord[];
  onOpenAddModal: () => void;
  onEditRecord: (record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenRawatInapTab?: () => void;
  canManageRecords?: boolean;
}

export const PatientRegisterTable: React.FC<PatientRegisterTableProps> = ({
  records,
  onOpenAddModal,
  onEditRecord,
  onDeleteRecord,
  onOpenRawatInapTab,
  canManageRecords = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusKeluarIGD>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | KategoriPembayaran>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [tindakanFilter, setTindakanFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search matches name, NIK, RM, or action
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        rec.namaPasien.toLowerCase().includes(q) ||
        rec.nik.includes(q) ||
        rec.noRm.toLowerCase().includes(q) ||
        (rec.diagnosa && rec.diagnosa.toLowerCase().includes(q)) ||
        rec.tindakanMedisUmum.toLowerCase().includes(q) ||
        rec.alamat.desa.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || rec.statusKeluar === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || rec.kategoriPembayaran === paymentFilter;
      const matchesVillage = villageFilter === 'ALL' || rec.alamat.desa === villageFilter;
      const matchesTindakan = tindakanFilter === 'ALL' || rec.tindakanMedisUmum.includes(tindakanFilter);
      const matchesDate = !dateFilter || rec.tanggalMasuk === dateFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesVillage && matchesTindakan && matchesDate;
    });
  }, [records, searchQuery, statusFilter, paymentFilter, villageFilter, tindakanFilter, dateFilter]);

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal Masuk IGD',
      'Jam Masuk IGD',
      'NIK',
      'No. RM',
      'Status Keluar IGD',
      'Nama Pasien',
      'Umur',
      'Jenis Kelamin',
      'Desa',
      'RT',
      'RW',
      'Diagnosa Medis',
      'Tindakan Medis Umum',
      'Kategori Pembayaran',
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.tanggalMasuk,
      r.jamMasuk || '-',
      r.nik ? `'${r.nik}` : '-',
      r.noRm || '-',
      `"${r.statusKeluar}"`,
      `"${r.namaPasien}"`,
      r.umurLabel || r.umur,
      r.jenisKelamin,
      `"${r.alamat.desa}"`,
      r.alamat.rt || '-',
      r.alamat.rw || '-',
      `"${(r.diagnosa || '').replace(/"/g, '""')}"`,
      `"${r.tindakanMedisUmum.replace(/"/g, '""')}"`,
      `"${r.kategoriPembayaran}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Buku_Register_Pasien_IGD_PUSKESMAS_WANAREJA_II_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StatusKeluarIGD) => {
    switch (status) {
      case 'Pulang Rawat Jalan':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Rawat Inap Puskesmas':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'Rujuk RSUD / RS Lanjutan':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Pulang APS (Permintaan Sendiri)':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Meninggal Dunia':
        return 'bg-slate-900 text-white border-slate-700';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPaymentBadge = (pay: KategoriPembayaran | string) => {
    if (pay === 'BPJS' || (typeof pay === 'string' && pay.toUpperCase().includes('BPJS'))) {
      return 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
    }
    return 'bg-sky-50 text-sky-800 border-sky-200 font-semibold';
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama Pasien, NIK, No. RM, atau Tindakan Medis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
        </div>

        {/* Filter Date */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-hidden text-xs"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-slate-400 hover:text-slate-600 ml-1"
                title="Hapus filter tanggal"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Ekspor ke Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Cetak Buku Register"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {canManageRecords && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm shadow-teal-900/30 transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasien</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Component Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
        <span className="font-semibold text-slate-600 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-teal-700" />
          Filter:
        </span>

        {/* Status Keluar Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | StatusKeluarIGD)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-teal-500"
        >
          <option value="ALL">Semua Status Keluar</option>
          <option value="Pulang Rawat Jalan">Pulang Rawat Jalan</option>
          <option value="Rawat Inap Puskesmas">Rawat Inap Puskesmas</option>
          <option value="Rujuk RSUD / RS Lanjutan">Rujuk RSUD / RS Lanjutan</option>
          <option value="Pulang APS (Permintaan Sendiri)">Pulang APS</option>
          <option value="Meninggal Dunia">Meninggal Dunia</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | KategoriPembayaran)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="ALL">Semua Pembayaran</option>
          <option value="BPJS">BPJS</option>
          <option value="Umum">Umum</option>
        </select>

        {/* Village Filter */}
        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="ALL">Semua Desa</option>
          {WANAREJA_II_VILLAGES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Tindakan Medis Filter */}
        <select
          value={tindakanFilter}
          onChange={(e) => setTindakanFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-teal-500 font-medium max-w-[190px] truncate"
        >
          <option value="ALL">Semua Tindakan Medis</option>
          {DAFTAR_TINDAKAN_MEDIS_UMUM.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <span className="ml-auto text-slate-500 font-mono">
          Menampilkan: <strong>{filteredRecords.length}</strong> dari {records.length} pasien
        </span>
      </div>

      {/* The Exact Register Table Layout Matching Reference Image */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Table Title Bar */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
              Buku Register Pasien IGD
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-800 text-teal-100">
              PUSKESMAS WANAREJA II
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Format Resmi Lampiran Rekapitulasi Pasien Masuk & Tindakan Medis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header styled exactly like the user attachment: Green background (#4ade80 / #34d399 / #5eead4 gradient or #48c78e solid) with black grid lines */}
            <thead>
              {/* Row 1 of Header */}
              <tr className="bg-[#48c78e] text-slate-950 font-bold text-center border-b border-black">
                <th rowSpan={2} className="px-3 py-2.5 border-r border-black w-10">
                  No
                </th>
                <th className="px-3 py-1.5 border-r border-black">
                  Tanggal &amp; Jam Masuk IGD
                </th>
                <th className="px-3 py-1.5 border-r border-black">
                  No. RM
                </th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-black min-w-[140px]">
                  Nama Pasien
                </th>
                <th rowSpan={2} className="px-2 py-2.5 border-r border-black w-14">
                  Umur
                </th>
                <th rowSpan={2} className="px-2 py-2.5 border-r border-black w-16">
                  Jenis Kelamin
                </th>
                <th colSpan={3} className="px-3 py-1.5 border-r border-black">
                  Alamat
                </th>
                <th rowSpan={2} className="px-3 py-2.5 border-r border-black min-w-[200px]">
                  Tindakan Medis Umum
                </th>
                <th rowSpan={2} className={`px-3 py-2.5 ${canManageRecords ? 'border-r border-black' : ''} min-w-[120px]`}>
                  Kategori Pembayaran
                </th>
                {canManageRecords && (
                  <th rowSpan={2} className="px-2 py-2.5 w-16">
                    Aksi
                  </th>
                )}
              </tr>
              {/* Row 2 of Header (Sub-headers & Split headers) */}
              <tr className="bg-[#48c78e] text-slate-950 font-bold text-center border-b-2 border-black">
                <th className="px-3 py-1.5 border-r border-black">
                  NIK
                </th>
                <th className="px-3 py-1.5 border-r border-black">
                  Status Keluar IGD
                </th>
                <th className="px-2.5 py-1.5 border-r border-black min-w-[100px]">
                  Desa
                </th>
                <th className="px-2 py-1.5 border-r border-black w-10">
                  RT
                </th>
                <th className="px-2 py-1.5 border-r border-black w-10">
                  RW
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={canManageRecords ? 12 : 11} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada catatan registrasi pasien yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-teal-50/40 transition border-b border-slate-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    {/* No */}
                    <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-700 border-r border-slate-200">
                      {index + 1}
                    </td>

                    {/* Tanggal & Jam Masuk IGD (top) / NIK (bottom) */}
                    <td className="px-3 py-2 border-r border-slate-200">
                      <div className="flex flex-wrap items-center gap-1 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{r.tanggalMasuk}</span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono text-[10px] font-semibold">
                          {r.jamMasuk ? `${r.jamMasuk} WIB` : '- WIB'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-teal-800 mt-0.5 tracking-tight">
                        {r.nik || '-'}
                      </div>
                    </td>

                    {/* No. RM (top) / Status Keluar IGD (bottom) */}
                    <td className="px-3 py-2 border-r border-slate-200">
                      {r.noRm ? (
                        <div className="font-mono font-bold text-slate-900">{r.noRm}</div>
                      ) : (
                        <div className="font-mono text-slate-400 text-[11px]">-</div>
                      )}
                      <div className="mt-1 flex flex-col items-start gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${getStatusBadge(
                            r.statusKeluar
                          )}`}
                        >
                          {r.statusKeluar}
                        </span>
                        {r.statusKeluar === 'Rawat Inap Puskesmas' && onOpenRawatInapTab && (
                          <button
                            type="button"
                            onClick={onOpenRawatInapTab}
                            className="text-[10px] font-semibold text-sky-700 hover:text-sky-900 underline decoration-sky-400 cursor-pointer whitespace-nowrap"
                            title="Lihat & lengkapi di Rekap Perawatan Rawat Inap"
                          >
                            Terekap di Ranap &rarr;
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Nama Pasien & Diagnosa */}
                    <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">
                      <div>{r.namaPasien}</div>
                      {r.diagnosa && (
                        <div className="mt-1">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-semibold">
                            {r.diagnosa}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Umur */}
                    <td className="px-2 py-2 text-center font-mono border-r border-slate-200 whitespace-nowrap">
                      {r.umurLabel || `${r.umur} th`}
                    </td>

                    {/* Jenis Kelamin */}
                    <td className="px-2 py-2 text-center font-semibold border-r border-slate-200">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                          r.jenisKelamin === 'L'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>

                    {/* Alamat: Desa */}
                    <td className="px-2.5 py-2 text-slate-700 border-r border-slate-200 whitespace-nowrap font-medium">
                      {r.alamat.desa}
                    </td>

                    {/* Alamat: RT */}
                    <td className="px-2 py-2 text-center font-mono text-slate-600 border-r border-slate-200">
                      {r.alamat.rt || '-'}
                    </td>

                    {/* Alamat: RW */}
                    <td className="px-2 py-2 text-center font-mono text-slate-600 border-r border-slate-200">
                      {r.alamat.rw || '-'}
                    </td>

                    {/* Tindakan Medis Umum */}
                    <td className="px-3 py-2 text-slate-800 border-r border-slate-200 max-w-[260px]">
                      <div className="line-clamp-2" title={r.tindakanMedisUmum}>
                        {r.tindakanMedisUmum}
                      </div>
                    </td>

                    {/* Kategori Pembayaran */}
                    <td className={`px-3 py-2 ${canManageRecords ? 'border-r border-slate-200' : ''}`}>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] border ${getPaymentBadge(
                          r.kategoriPembayaran
                        )}`}
                      >
                        {r.kategoriPembayaran}
                      </span>
                    </td>

                    {/* Aksi */}
                    {canManageRecords && (
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRecord(r)}
                            className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Catatan Pasien"
                            aria-label={`Edit pasien ${r.namaPasien}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus Catatan"
                            aria-label={`Hapus pasien ${r.namaPasien}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
