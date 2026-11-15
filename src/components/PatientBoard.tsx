import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Check, 
  Bed as BedIcon,
  Stethoscope, 
  Activity, 
  FileText, 
  LayoutGrid, 
  List,
  User,
  HeartPulse,
  Share2
} from 'lucide-react';
import { Bed, PatientStatus, PatientTrack, TriageCategory } from '../types/index';
import { TRIAGE_CONFIG, getMinutesElapsed, getResponseTimeStatus } from '../utils/triage';

interface PatientBoardProps {
  patients: PatientTrack[];
  beds: Bed[];
  onSelectPatient: (patient: PatientTrack) => void;
  onAdvancePatientStatus: (patientId: string, nextStatus: PatientStatus) => void;
  onOpenRegister: () => void;
}

const STAGES: { id: PatientStatus; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'triage', title: '1. Masuk & Triage', subtitle: 'Registrasi & Skrining', icon: Clock },
  { id: 'tindakan', title: '2. Tindakan Medis', subtitle: 'Pemeriksaan Dokter', icon: Stethoscope },
  { id: 'observasi', title: '3. Observasi & Lab', subtitle: 'Monitoring & Terapi', icon: Activity },
  { id: 'disposisi', title: '4. Disposisi', subtitle: 'Rencana Alih Rawat', icon: Share2 },
  { id: 'selesai', title: '5. Selesai', subtitle: 'Pulang / Dirujuk', icon: Check },
];

export const PatientBoard: React.FC<PatientBoardProps> = ({
  patients,
  beds,
  onSelectPatient,
  onAdvancePatientStatus,
  onOpenRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [triageFilter, setTriageFilter] = useState<'ALL' | TriageCategory>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    // Search query matches name, NIK, RM, or village
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      patient.fullName.toLowerCase().includes(query) ||
      patient.medicalRecordNumber.toLowerCase().includes(query) ||
      patient.nik.includes(query) ||
      patient.registrationNumber.toLowerCase().includes(query) ||
      patient.addressVillage.toLowerCase().includes(query);

    // Triage filter
    const matchesTriage = triageFilter === 'ALL' || patient.triage === triageFilter;

    return matchesSearch && matchesTriage;
  });

  const getBedName = (bedId?: string) => {
    if (!bedId) return 'Tanpa Bed (Ruang Tunggu)';
    const bed = beds.find((b) => b.id === bedId);
    return bed ? bed.name : bedId;
  };

  const getNextStatus = (current: PatientStatus): PatientStatus | null => {
    switch (current) {
      case 'triage': return 'tindakan';
      case 'tindakan': return 'observasi';
      case 'observasi': return 'disposisi';
      case 'disposisi': return 'selesai';
      default: return null;
    }
  };

  const getNextStatusLabel = (current: PatientStatus): string => {
    switch (current) {
      case 'triage': return 'Ke Tindakan Dokter';
      case 'tindakan': return 'Ke Ruang Observasi';
      case 'observasi': return 'Proses Disposisi';
      case 'disposisi': return 'Selesaikan Kasus';
      default: return 'Selesai';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pasien berdasarkan Nama, No. RM, NIK, atau Desa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/40 focus:border-teal-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Triage Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Triage:
          </span>
          <button
            onClick={() => setTriageFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              triageFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({patients.length})
          </button>
          <button
            onClick={() => setTriageFilter('P1')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              triageFilter === 'P1'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            P1 Merah ({patients.filter((p) => p.triage === 'P1').length})
          </button>
          <button
            onClick={() => setTriageFilter('P2')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              triageFilter === 'P2'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            P2 Kuning ({patients.filter((p) => p.triage === 'P2').length})
          </button>
          <button
            onClick={() => setTriageFilter('P3')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              triageFilter === 'P3'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            P3 Hijau ({patients.filter((p) => p.triage === 'P3').length})
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end md:self-auto">
          <button
            onClick={() => setViewMode('kanban')}
            aria-label="Tampilan Jalur Alur"
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
              viewMode === 'kanban'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jejak Alur</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="Tampilan Tabel Pasien"
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
              viewMode === 'list'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        /* Kanban Stage Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const stagePatients = filteredPatients.filter((p) => p.status === stage.id);
            const isCompletedStage = stage.id === 'selesai';

            return (
              <div
                key={stage.id}
                className="bg-slate-100/80 rounded-xl border border-slate-200/90 flex flex-col h-full min-h-[500px] overflow-hidden"
              >
                {/* Stage Header */}
                <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800">{stage.title}</h3>
                      <p className="text-[10px] text-slate-500">{stage.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                    {stagePatients.length}
                  </span>
                </div>

                {/* Stage Cards Container */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stagePatients.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/50">
                      Tidak ada pasien
                    </div>
                  ) : (
                    stagePatients.map((patient) => {
                      const triageCfg = TRIAGE_CONFIG[patient.triage];
                      const minutes = getMinutesElapsed(patient.registeredAt);
                      const responseStatus = getResponseTimeStatus(patient.registeredAt, patient.triage);
                      const nextStatus = getNextStatus(patient.status);

                      return (
                        <div
                          key={patient.id}
                          className={`bg-white rounded-xl border p-3 shadow-xs hover:shadow-md transition-all relative group ${
                            patient.triage === 'P1'
                              ? 'border-rose-300 hover:border-rose-400 ring-1 ring-rose-100'
                              : 'border-slate-200 hover:border-teal-300'
                          }`}
                        >
                          {/* Top Tag & Time */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${triageCfg.bgBadge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${triageCfg.indicatorColor} ${
                                  patient.triage === 'P1' ? 'animate-ping' : ''
                                }`}
                              />
                              {patient.triage} - {triageCfg.colorName}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{minutes} mnt lalu</span>
                              {responseStatus.isDelayed && patient.status === 'triage' && (
                                <span title="Melebihi target respons">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient Identity */}
                          <div className="mb-2">
                            <div className="flex items-baseline justify-between">
                              <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
                                {patient.fullName}
                              </h4>
                              <span className="text-[11px] font-semibold text-slate-500">
                                {patient.age} th ({patient.gender})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-mono text-teal-700 font-medium">{patient.medicalRecordNumber}</span>
                              <span>•</span>
                              <span>{patient.addressVillage}</span>
                            </div>
                          </div>

                          {/* Bed & Admission Method */}
                          <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] mb-2">
                            <BedIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="font-medium text-slate-700 truncate">
                              {getBedName(patient.bedId)}
                            </span>
                          </div>

                          {/* Chief Complaint */}
                          <p className="text-xs text-slate-600 line-clamp-2 mb-2.5 bg-amber-50/50 p-1.5 rounded border border-amber-100/70 italic">
                            &quot;{patient.chiefComplaint}&quot;
                          </p>

                          {/* Key Vitals Pill Strip */}
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center mb-3">
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-slate-400 block text-[8px]">TD</span>
                              <span className="font-bold text-slate-800">{patient.vitals.systolic}/{patient.vitals.diastolic}</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-slate-400 block text-[8px]">HR</span>
                              <span className="font-bold text-slate-800">{patient.vitals.heartRate}</span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-slate-400 block text-[8px]">SpO2</span>
                              <span className={`font-bold ${patient.vitals.oxygenSaturation < 92 ? 'text-rose-600' : 'text-slate-800'}`}>
                                {patient.vitals.oxygenSaturation}%
                              </span>
                            </div>
                            <div className="bg-slate-50 p-1 rounded border border-slate-100">
                              <span className="text-slate-400 block text-[8px]">Suhu</span>
                              <span className="font-bold text-slate-800">{patient.vitals.temperature}°C</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => onSelectPatient(patient)}
                              className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Detail</span>
                            </button>

                            {nextStatus && (
                              <button
                                onClick={() => onAdvancePatientStatus(patient.id, nextStatus)}
                                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center justify-center gap-1 transition cursor-pointer"
                                title={getNextStatusLabel(patient.status)}
                              >
                                <span>{stage.id === 'disposisi' ? 'Selesai' : 'Lanjut'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isCompletedStage && (
                              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                {patient.dispositionType === 'rujuk_rs' ? 'Dirujuk' : 'Tuntas'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">No. RM & Nama Pasien</th>
                  <th className="px-3 py-3">Triage</th>
                  <th className="px-3 py-3">Tahap Alur</th>
                  <th className="px-3 py-3">Lokasi Bed</th>
                  <th className="px-3 py-3">Tanda Vital</th>
                  <th className="px-3 py-3">Keluhan</th>
                  <th className="px-3 py-3">Waktu Masuk</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tidak ditemukan data pasien sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const triageCfg = TRIAGE_CONFIG[patient.triage];
                    const nextStatus = getNextStatus(patient.status);

                    return (
                      <tr key={patient.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{patient.fullName}</div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                            <span className="text-teal-700 font-semibold">{patient.medicalRecordNumber}</span>
                            <span>•</span>
                            <span>{patient.age} th ({patient.gender})</span>
                            <span>•</span>
                            <span>{patient.addressVillage}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${triageCfg.bgBadge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${triageCfg.indicatorColor}`} />
                            {patient.triage}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium">
                          {getBedName(patient.bedId)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">
                          <div>TD: {patient.vitals.systolic}/{patient.vitals.diastolic} mmHg</div>
                          <div>SpO2: {patient.vitals.oxygenSaturation}% | HR: {patient.vitals.heartRate}</div>
                        </td>
                        <td className="px-3 py-3 max-w-[200px] truncate text-slate-600" title={patient.chiefComplaint}>
                          {patient.chiefComplaint}
                        </td>
                        <td className="px-3 py-3 text-slate-500 font-mono text-xs">
                          {new Date(patient.registeredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSelectPatient(patient)}
                              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                              title="Lihat Detail Pasien"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {nextStatus && (
                              <button
                                onClick={() => onAdvancePatientStatus(patient.id, nextStatus)}
                                className="px-2.5 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1 transition"
                              >
                                <span>Lanjut</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
