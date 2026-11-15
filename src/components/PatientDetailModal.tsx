import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Clock, 
  HeartPulse, 
  User, 
  MapPin, 
  CheckCircle2, 
  Send, 
  ArrowRight, 
  AlertTriangle, 
  Stethoscope, 
  FileText,
  Share2,
  Bed as BedIcon
} from 'lucide-react';
import { Bed, DispositionType, PatientStatus, PatientTrack } from '../types/index';
import { TRIAGE_CONFIG, getMinutesElapsed } from '../utils/triage';

interface PatientDetailModalProps {
  patient: PatientTrack | null;
  onClose: () => void;
  beds: Bed[];
  onAddNote: (patientId: string, note: string) => void;
  onAdvanceStatus: (patientId: string, nextStatus: PatientStatus) => void;
  onSetDisposition: (patientId: string, type: DispositionType, destination: string) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  beds,
  onAddNote,
  onAdvanceStatus,
  onSetDisposition,
}) => {
  const [newNote, setNewNote] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<DispositionType>('rawat_jalan');
  const [dispositionDest, setDispositionDest] = useState('');
  const [isSettingDisp, setIsSettingDisp] = useState(false);

  if (!patient) return null;

  const triageCfg = TRIAGE_CONFIG[patient.triage];
  const currentBed = beds.find((b) => b.id === patient.bedId);

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(patient.id, newNote.trim());
    setNewNote('');
  };

  const handleApplyDisposition = () => {
    let dest = dispositionDest.trim();
    if (!dest) {
      if (selectedDisposition === 'rawat_jalan') dest = 'Pulang Rawat Jalan ke Rumah';
      else if (selectedDisposition === 'rawat_inap') dest = 'Bangsal Rawat Inap Puskesmas Wanareja II';
      else if (selectedDisposition === 'rujuk_rs') dest = 'RSUD Majenang (via SISRUTE)';
      else if (selectedDisposition === 'aps') dest = 'Pulang Atas Permintaan Sendiri (APS)';
    }
    onSetDisposition(patient.id, selectedDisposition, dest);
    setIsSettingDisp(false);
  };

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${triageCfg.indicatorColor}`}>
              {patient.triage}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{patient.fullName}</h3>
                <span className="text-xs text-slate-300 font-mono">({patient.medicalRecordNumber})</span>
              </div>
              <p className="text-xs text-slate-400">
                {patient.registrationNumber} • Masuk: {new Date(patient.registeredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTicket}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Rekam</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup Rekam Pasien"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Triage Banner & Status Track */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${triageCfg.bgBadge}`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block text-slate-700">Kategori Triage Terverifikasi</span>
              <div className="font-bold text-base mt-0.5">{triageCfg.label}</div>
              <p className="text-xs text-slate-600 mt-1">{patient.triageReason}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Tahap Pelayanan Saat Ini:</span>
              <span className="font-bold capitalize text-sm text-slate-900 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-300 inline-block mt-0.5">
                {patient.status}
              </span>
            </div>
          </div>

          {/* Electronic Patient Journey / Pathway Stepper */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              Rekam Jejak Elektronik Pelayanan (Electronic Track)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {/* Step 1 */}
              <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-[10px] mb-1">
                  1
                </span>
                <span className="font-bold block">Masuk & Triage</span>
                <span className="text-[10px] font-mono text-emerald-700">
                  {new Date(patient.registeredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Step 2 */}
              <div className={`p-2.5 rounded-xl border ${
                ['tindakan', 'observasi', 'disposisi', 'selesai'].includes(patient.status)
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-300 text-white font-bold flex items-center justify-center mx-auto text-[10px] mb-1">
                  2
                </span>
                <span className="font-bold block">Tindakan Medis</span>
                <span className="text-[10px] font-mono">
                  {patient.doctorExamStartedAt ? new Date(patient.doctorExamStartedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>

              {/* Step 3 */}
              <div className={`p-2.5 rounded-xl border ${
                ['observasi', 'disposisi', 'selesai'].includes(patient.status)
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-300 text-white font-bold flex items-center justify-center mx-auto text-[10px] mb-1">
                  3
                </span>
                <span className="font-bold block">Observasi/Lab</span>
                <span className="text-[10px] font-mono">
                  {patient.observationStartedAt ? new Date(patient.observationStartedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>

              {/* Step 4 */}
              <div className={`p-2.5 rounded-xl border ${
                ['disposisi', 'selesai'].includes(patient.status)
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-300 text-white font-bold flex items-center justify-center mx-auto text-[10px] mb-1">
                  4
                </span>
                <span className="font-bold block">Disposisi</span>
                <span className="text-[10px] font-mono">
                  {patient.dispositionAt ? new Date(patient.dispositionAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>

              {/* Step 5 */}
              <div className={`p-2.5 rounded-xl border ${
                patient.status === 'selesai'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <span className="w-5 h-5 rounded-full bg-slate-300 text-white font-bold flex items-center justify-center mx-auto text-[10px] mb-1">
                  5
                </span>
                <span className="font-bold block">Selesai</span>
                <span className="text-[10px] font-mono">{patient.status === 'selesai' ? 'Tuntas' : '-'}</span>
              </div>
            </div>
          </div>

          {/* Vitals Summary Strip */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Tanda-Tanda Vital (Saat Masuk)
              </span>
              <span className="text-xs font-normal text-slate-500 font-mono">Kesadaran: {patient.vitals.consciousness}</span>
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Tekanan Darah</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.vitals.systolic}/{patient.vitals.diastolic}</span>
                <span className="text-[9px] text-slate-500 block">mmHg</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Nadi / HR</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.vitals.heartRate}</span>
                <span className="text-[9px] text-slate-500 block">bpm</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Saturasi SpO2</span>
                <span className={`font-bold font-mono text-sm ${patient.vitals.oxygenSaturation < 92 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {patient.vitals.oxygenSaturation}%
                </span>
                <span className="text-[9px] text-slate-500 block">O2</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Pernapasan (RR)</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.vitals.respiratoryRate}</span>
                <span className="text-[9px] text-slate-500 block">x/mnt</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Suhu Tubuh</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.vitals.temperature}°C</span>
                <span className="text-[9px] text-slate-500 block">Celsius</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Skala Nyeri</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{patient.vitals.painScale}/10</span>
                <span className="text-[9px] text-slate-500 block">VAS</span>
              </div>
            </div>
          </div>

          {/* Patient Details & Admission Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Informasi Pendaftaran</span>
              <div><strong className="text-slate-600">NIK:</strong> <span className="font-mono text-slate-800">{patient.nik}</span></div>
              <div><strong className="text-slate-600">Alamat:</strong> {patient.addressVillage}, {patient.rtRw}</div>
              <div><strong className="text-slate-600">Cara Masuk:</strong> {patient.arrivalMethod}</div>
              <div><strong className="text-slate-600">Penjamin:</strong> {patient.insurance}</div>
              <div><strong className="text-slate-600">Kontak:</strong> {patient.phone}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Lokasi & Tenaga Medis</span>
              <div><strong className="text-slate-600">Bed IGD:</strong> {currentBed ? currentBed.name : 'Ruang Tunggu'}</div>
              <div><strong className="text-slate-600">Dokter Jaga:</strong> {patient.doctorInCharge}</div>
              <div><strong className="text-slate-600">Perawat Jaga:</strong> {patient.nurseInCharge}</div>
              {patient.dispositionDestination && (
                <div><strong className="text-slate-600">Disposisi:</strong> <span className="text-teal-700 font-semibold">{patient.dispositionDestination}</span></div>
              )}
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Keluhan Utama:</h4>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-slate-800 italic">
              &quot;{patient.chiefComplaint}&quot;
            </div>
          </div>

          {/* Clinical Notes Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              Catatan Tindakan Medis & Keperawatan (EHR Notes)
            </h4>

            <div className="space-y-2">
              {patient.notes.map((note, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddNoteSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Tambah catatan perkembangan / hasil lab / instruksi obat..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </form>
          </div>

          {/* Quick Stage Progression & Disposition Actions */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Aksi Lanjutan Alur Pelayanan Pasien
              </span>
              <button
                onClick={() => setIsSettingDisp(!isSettingDisp)}
                className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
              >
                {isSettingDisp ? 'Tutup Pilihan Disposisi' : 'Tentukan Disposisi Akhir'}
              </button>
            </div>

            {isSettingDisp ? (
              <div className="p-3 bg-white rounded-xl border border-teal-300 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Pilihan Disposisi:</label>
                    <select
                      value={selectedDisposition}
                      onChange={(e) => setSelectedDisposition(e.target.value as DispositionType)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    >
                      <option value="rawat_jalan">Pulang Rawat Jalan</option>
                      <option value="rawat_inap">Rawat Inap Puskesmas Wanareja II</option>
                      <option value="rujuk_rs">Rujuk ke RSUD / RS Lanjutan (SISRUTE)</option>
                      <option value="aps">Pulang Atas Permintaan Sendiri (APS)</option>
                      <option value="meninggal">Meninggal Dunia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Keterangan / Tujuan:</label>
                    <input
                      type="text"
                      placeholder="Contoh: RSUD Majenang / Kamar Mawar 02"
                      value={dispositionDest}
                      onChange={(e) => setDispositionDest(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyDisposition}
                  className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer"
                >
                  Simpan Keputusan Disposisi
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patient.status === 'triage' && (
                  <button
                    onClick={() => onAdvanceStatus(patient.id, 'tindakan')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Lanjut ke Tindakan Dokter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {patient.status === 'tindakan' && (
                  <button
                    onClick={() => onAdvanceStatus(patient.id, 'observasi')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Pindahkan ke Observasi / Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {patient.status === 'observasi' && (
                  <button
                    onClick={() => onAdvanceStatus(patient.id, 'disposisi')}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Proses Disposisi Pasien</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {patient.status === 'disposisi' && (
                  <button
                    onClick={() => onAdvanceStatus(patient.id, 'selesai')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tandai Selesai Pelayanan IGD</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup Rekam
          </button>
        </div>
      </div>
    </div>
  );
};
