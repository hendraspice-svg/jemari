import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  HeartPulse, 
  User, 
  AlertCircle, 
  Bed as BedIcon, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Ambulance 
} from 'lucide-react';
import { Bed, PatientTrack, TriageCategory, VitalSigns, WANAREJA_II_VILLAGES } from '../types/index';
import { evaluateTriagePriority, getRecommendedBed, TRIAGE_CONFIG } from '../utils/triage';

interface QuickRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: Bed[];
  onRegisterPatient: (
    patient: PatientTrack,
    masukInfo?: { tanggalMasuk: string; jamMasuk: string }
  ) => void;
}

export const QuickRegistrationModal: React.FC<QuickRegistrationModalProps> = ({
  isOpen,
  onClose,
  beds,
  onRegisterPatient,
}) => {
  const now = new Date();
  const [tanggalMasuk, setTanggalMasuk] = useState(now.toISOString().slice(0, 10));
  const [jamMasuk, setJamMasuk] = useState(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  );
  // Form States
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [phone, setPhone] = useState('');
  const [addressVillage, setAddressVillage] = useState<string>(WANAREJA_II_VILLAGES[0]);
  const [rtRw, setRtRw] = useState('RT 01 / RW 01');
  const [arrivalMethod, setArrivalMethod] = useState<PatientTrack['arrivalMethod']>('Sendiri');
  const [insurance, setInsurance] = useState<PatientTrack['insurance']>('BPJS');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Vital Signs
  const [systolic, setSystolic] = useState<number | ''>(120);
  const [diastolic, setDiastolic] = useState<number | ''>(80);
  const [heartRate, setHeartRate] = useState<number | ''>(80);
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(20);
  const [temperature, setTemperature] = useState<number | ''>(36.5);
  const [oxygenSaturation, setOxygenSaturation] = useState<number | ''>(98);
  const [painScale, setPainScale] = useState<number>(2);
  const [consciousness, setConsciousness] = useState<VitalSigns['consciousness']>('Compos Mentis');

  // Manual triage override
  const [customTriage, setCustomTriage] = useState<TriageCategory | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [doctorInCharge, setDoctorInCharge] = useState('dr. Hendra Prasetyo');
  const [nurseInCharge, setNurseInCharge] = useState('Ns. Siti Rohmah, S.Kep');
  const [formError, setFormError] = useState('');

  // Auto evaluate triage priority
  const evaluation = useMemo(() => {
    return evaluateTriagePriority(
      {
        systolic: systolic === '' ? 120 : systolic,
        diastolic: diastolic === '' ? 80 : diastolic,
        heartRate: heartRate === '' ? 80 : heartRate,
        respiratoryRate: respiratoryRate === '' ? 20 : respiratoryRate,
        temperature: temperature === '' ? 36.5 : temperature,
        oxygenSaturation: oxygenSaturation === '' ? 98 : oxygenSaturation,
        painScale,
        consciousness,
      },
      chiefComplaint
    );
  }, [systolic, diastolic, heartRate, respiratoryRate, temperature, oxygenSaturation, painScale, consciousness, chiefComplaint]);

  const activeTriage: TriageCategory = customTriage || evaluation.category;

  // Auto recommend bed
  const recommendedBed = useMemo(() => {
    return getRecommendedBed(activeTriage, beds);
  }, [activeTriage, beds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Nama lengkap pasien wajib diisi');
      return;
    }
    if (age === '' || Number(age) < 0) {
      setFormError('Usia pasien wajib diisi dengan benar');
      return;
    }
    if (!chiefComplaint.trim()) {
      setFormError('Keluhan utama wajib diisi');
      return;
    }

    const randomRm = `RM-${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanDate = tanggalMasuk || new Date().toISOString().slice(0, 10);
    const cleanTime = jamMasuk || '08:00';
    const randomReg = `IGD-${cleanDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newPatient: PatientTrack = {
      id: `pat-${Date.now()}`,
      registrationNumber: randomReg,
      medicalRecordNumber: randomRm,
      nik: nik.trim() || '330104' + Math.floor(1000000000 + Math.random() * 9000000000),
      fullName: fullName.trim(),
      birthDate: `${new Date().getFullYear() - Number(age)}-01-01`,
      age: Number(age),
      gender,
      phone: phone.trim() || '0812-xxxx-xxxx',
      addressVillage,
      rtRw,
      arrivalMethod,
      insurance,
      chiefComplaint: chiefComplaint.trim(),
      triage: activeTriage,
      triageReason: evaluation.reason || 'Kondisi umum stabil',
      vitals: {
        systolic: Number(systolic) || 120,
        diastolic: Number(diastolic) || 80,
        heartRate: Number(heartRate) || 80,
        respiratoryRate: Number(respiratoryRate) || 20,
        temperature: Number(temperature) || 36.5,
        oxygenSaturation: Number(oxygenSaturation) || 98,
        painScale,
        gcs: 'E4V5M6 (15)',
        consciousness,
      },
      bedId: selectedBedId || recommendedBed?.id,
      status: 'triage',
      registeredAt: `${cleanDate}T${cleanTime}:00`,
      doctorInCharge,
      nurseInCharge,
      notes: [
        `Pasien masuk IGD pada ${cleanDate} pukul ${cleanTime} WIB via ${arrivalMethod}. Keluhan utama: "${chiefComplaint.trim()}".`,
        `Kategori triage: ${activeTriage} (${evaluation.reason}).`,
      ],
    };

    onRegisterPatient(newPatient, { tanggalMasuk: cleanDate, jamMasuk: cleanTime });
    onClose();
  };

  const triageCfg = TRIAGE_CONFIG[activeTriage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Registrasi Masuk Pasien IGD</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-200 border border-teal-400/40">
                  JEMARI IGD RANAP
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Puskesmas Wanareja II • Pencatatan Rekam Jejak Elektronik & Triage Cepat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Formulir"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Realtime Smart Triage Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${triageCfg.bgBadge} transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${triageCfg.indicatorColor}`}>
                {activeTriage}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Hasil Skrining Triage Otomatis:</span>
                  <span className="font-bold text-sm">{triageCfg.label}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{evaluation.reason}</p>
              </div>
            </div>

            {/* Manual Triage Override Buttons */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <span className="text-[11px] font-medium text-slate-500 mr-1">Ubah Manual:</span>
              {(['P1', 'P2', 'P3'] as TriageCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCustomTriage(cat === activeTriage && customTriage ? null : cat)}
                  className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    activeTriage === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Data Identitas Pasien */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1.5">
              <User className="w-4 h-4 text-teal-600" />
              1. Identitas & Asal Pasien
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Masuk IGD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  aria-label="Tanggal Masuk IGD"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Masuk IGD (WIB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  aria-label="Jam Masuk IGD (WIB)"
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Ahmad Subandi"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIK (KTP) / No. Identitas
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 Digit NIK"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usia (Tahun) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  placeholder="Th"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wilayah / Desa
                </label>
                <select
                  value={addressVillage}
                  onChange={(e) => setAddressVillage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition font-medium"
                >
                  {WANAREJA_II_VILLAGES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RT / RW
                </label>
                <input
                  type="text"
                  placeholder="RT 02 / RW 01"
                  value={rtRw}
                  onChange={(e) => setRtRw(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cara Masuk Pasien
                </label>
                <select
                  value={arrivalMethod}
                  onChange={(e) => setArrivalMethod(e.target.value as PatientTrack['arrivalMethod'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                >
                  <option value="Sendiri">Datang Sendiri</option>
                  <option value="Keluarga">Diantar Keluarga</option>
                  <option value="Ambulans Siaga Desa">Ambulans Siaga Desa</option>
                  <option value="Rujukan Bidan Desa">Rujukan Bidan Desa</option>
                  <option value="Kader Posyandu">Rujukan Kader Posyandu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Penjamin / Biaya
                </label>
                <select
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value as PatientTrack['insurance'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition font-medium"
                >
                  <option value="BPJS">BPJS</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. HP / WA Keluarga
                </label>
                <input
                  type="text"
                  placeholder="0813-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Keluhan Utama & Tanda-Tanda Vital */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              2. Keluhan & Tanda Vital Awal (Triage Vital Signs)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keluhan Utama Pasien <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Deskripsikan keluhan utama, durasi, dan tanda-tanda yang dialami pasien..."
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TD Sistolik (mmHg)
                </label>
                <input
                  type="number"
                  aria-label="TD Sistolik"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TD Diastolik (mmHg)
                </label>
                <input
                  type="number"
                  aria-label="TD Diastolik"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nadi / HR (bpm)
                </label>
                <input
                  type="number"
                  aria-label="Nadi / HR"
                  placeholder="80"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pernapasan / RR
                </label>
                <input
                  type="number"
                  aria-label="Pernapasan / RR"
                  placeholder="20"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  aria-label="SpO2"
                  placeholder="98"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Suhu Tubuh (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  aria-label="Suhu Tubuh"
                  placeholder="36.5"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Kesadaran
                </label>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(e.target.value as VitalSigns['consciousness'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Compos Mentis">Compos Mentis (Sadar Penuh - Normal)</option>
                  <option value="Apatis">Apatis (Acuh / Mengantuk Ringan)</option>
                  <option value="Somnolen">Somnolen (Tidur / Respon Suara)</option>
                  <option value="Sopor">Sopor (Hanya Respon Rangsang Nyeri)</option>
                  <option value="Koma">Koma (Tidak Ada Respon)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skala Nyeri (0 - 10): <span className="font-bold text-teal-700">{painScale}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painScale}
                    onChange={(e) => setPainScale(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border text-slate-700">
                    {painScale}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Alokasi Bed & Petugas Jaga */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-1.5">
              <BedIcon className="w-4 h-4 text-cyan-600" />
              3. Penempatan Bed & Dokter Jaga
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilihan Bed IGD
                </label>
                <select
                  value={selectedBedId || recommendedBed?.id || ''}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                >
                  <option value="">-- Ruang Tunggu (Tanpa Bed) --</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.status !== 'available'}>
                      {b.name} ({b.status === 'available' ? 'Tersedia' : b.status === 'occupied' ? 'Terisi' : 'Sterilisasi'})
                    </option>
                  ))}
                </select>
                {recommendedBed && !selectedBedId && (
                  <p className="text-[11px] text-teal-700 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Rekomendasi sistem: {recommendedBed.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dokter Jaga IGD
                </label>
                <select
                  value={doctorInCharge}
                  onChange={(e) => setDoctorInCharge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                >
                  <option value="dr. Hendra Prasetyo">dr. Hendra Prasetyo</option>
                  <option value="dr. Dwi Aryanti">dr. Dwi Aryanti</option>
                  <option value="dr. Kurniawan">dr. Kurniawan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perawat / Bidan Jaga
                </label>
                <select
                  value={nurseInCharge}
                  onChange={(e) => setNurseInCharge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 transition"
                >
                  <option value="Ns. Siti Rohmah, S.Kep">Ns. Siti Rohmah, S.Kep</option>
                  <option value="Ns. Agus Salim, S.Kep">Ns. Agus Salim, S.Kep</option>
                  <option value="Bdn. Tri Wahyuni, S.Tr.Keb">Bdn. Tri Wahyuni, S.Tr.Keb</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-md shadow-teal-900/30 flex items-center gap-2 cursor-pointer transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Daftarkan Pasien & Mulai Alur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
