import React from 'react';
import { 
  Bed as BedIcon, 
  Activity, 
  Wind, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { Bed, PatientTrack } from '../types/index';
import { TRIAGE_CONFIG, calculateBedOccupancyRate, getMinutesElapsed } from '../utils/triage';

interface BedManagementProps {
  beds: Bed[];
  patients: PatientTrack[];
  onUpdateBedStatus: (bedId: string, status: Bed['status']) => void;
  onSelectPatientById: (patientId: string) => void;
  onOpenRegister: () => void;
}

export const BedManagement: React.FC<BedManagementProps> = ({
  beds,
  patients,
  onUpdateBedStatus,
  onSelectPatientById,
  onOpenRegister,
}) => {
  const bor = calculateBedOccupancyRate(beds);
  const availableCount = beds.filter((b) => b.status === 'available').length;
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
  const cleaningCount = beds.filter((b) => b.status === 'cleaning').length;

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-teal-600" />
            <span>Kapasitas & Manajemen Bed IGD Puskesmas Wanareja II</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            6 Bed Terstandar Kemenkes RI • Dilengkapi Oksigen Medis & Monitor Hemodinamik
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Tersedia: <strong>{availableCount} Bed</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Terisi: <strong>{occupiedCount} Bed</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Sterilisasi: <strong>{cleaningCount} Bed</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-teal-900 text-teal-100 text-xs font-mono font-bold flex items-center gap-1">
            <span>BOR: {bor}%</span>
          </div>
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beds.map((bed) => {
          const isOccupied = bed.status === 'occupied';
          const isAvailable = bed.status === 'available';
          const isCleaning = bed.status === 'cleaning';

          const patient = bed.currentPatientId
            ? patients.find((p) => p.id === bed.currentPatientId)
            : undefined;

          const triageCfg = patient ? TRIAGE_CONFIG[patient.triage] : null;
          const duration = bed.occupiedSince ? getMinutesElapsed(bed.occupiedSince) : 0;

          return (
            <div
              key={bed.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
                isOccupied
                  ? patient?.triage === 'P1'
                    ? 'border-rose-400 ring-2 ring-rose-100 shadow-md'
                    : 'border-amber-300 ring-1 ring-amber-50 shadow-xs'
                  : isCleaning
                  ? 'border-indigo-200 bg-indigo-50/20'
                  : 'border-slate-200 hover:border-teal-300'
              }`}
            >
              <div>
                {/* Header Bed */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 uppercase tracking-wider block w-fit mb-1">
                      {bed.categoryLabel}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{bed.name}</h3>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isOccupied
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-500'
                          : isOccupied
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-indigo-500'
                      }`}
                    />
                    {isAvailable ? 'Tersedia' : isOccupied ? 'Sedang Terisi' : 'Sterilisasi'}
                  </span>
                </div>

                {/* Patient Occupancy Box or Empty Status */}
                {isOccupied && patient ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        {patient.fullName}
                      </div>
                      {triageCfg && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${triageCfg.bgBadge}`}>
                          {patient.triage}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>{patient.medicalRecordNumber} • {patient.age} th</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        {duration} mnt
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      &quot;{patient.chiefComplaint}&quot;
                    </p>

                    <button
                      onClick={() => onSelectPatientById(patient.id)}
                      className="w-full mt-1 text-center py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition cursor-pointer"
                    >
                      Buka Rekam Jejak Pasien
                    </button>
                  </div>
                ) : isCleaning ? (
                  <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 mb-3 text-center space-y-1">
                    <RefreshCw className="w-5 h-5 text-indigo-600 mx-auto animate-spin" />
                    <p className="text-xs font-semibold text-indigo-900">Sedang Proses Dekontaminasi</p>
                    <p className="text-[11px] text-indigo-600">Pembersihan linen dan desinfeksi alat medis</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 mb-3 text-center space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <p className="text-xs font-semibold text-emerald-900">Bed Siaga & Higienis</p>
                    <p className="text-[11px] text-emerald-600">Siap menerima pasien gawat darurat baru</p>
                  </div>
                )}

                {/* Facilities & Equipment Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {bed.oxygenEquipped && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                      <Wind className="w-3 h-3 text-sky-500" />
                      Oksigen Sentral
                    </span>
                  )}
                  {bed.monitorEquipped && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      <Activity className="w-3 h-3 text-purple-500" />
                      Monitor Vital / EKG
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isAvailable && (
                  <button
                    onClick={onOpenRegister}
                    className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <span>Tempatkan Pasien Baru</span>
                  </button>
                )}

                {isOccupied && (
                  <button
                    onClick={() => onUpdateBedStatus(bed.id, 'cleaning')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kosongkan & Mulai Sterilisasi</span>
                  </button>
                )}

                {isCleaning && (
                  <button
                    onClick={() => onUpdateBedStatus(bed.id, 'available')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tandai Selesai Steril (Tersedia)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
