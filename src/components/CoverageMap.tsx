import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation as NavIcon, 
  PhoneCall, 
  Ambulance, 
  Building2, 
  Clock, 
  Users, 
  ExternalLink,
  Shield,
  Activity
} from 'lucide-react';
import { VillageCoverage } from '../types/index';
import { VILLAGE_COVERAGE } from '../data/initialData';

export const CoverageMap: React.FC = () => {
  const [selectedVillage, setSelectedVillage] = useState<VillageCoverage>(VILLAGE_COVERAGE[0]);
  const [filterRadius, setFilterRadius] = useState<'ALL' | 'NEAR' | 'FAR'>('ALL');

  const filteredVillages = VILLAGE_COVERAGE.filter((v) => {
    if (filterRadius === 'NEAR') return v.distanceKm <= 5.0;
    if (filterRadius === 'FAR') return v.distanceKm > 5.0;
    return true;
  });

  const referralHospitals = [
    {
      name: 'RSUD Majenang',
      type: 'Rumah Sakit Rujukan Utama (Tipe C)',
      distanceKm: 12.4,
      travelTimeMin: 18,
      status: 'Siaga SISRUTE 24 Jam',
      specialties: ['Sp.JP (Jantung)', 'Sp.B (Bedah Umum)', 'Sp.OG (Kebidanan)', 'ICU & NICU'],
    },
    {
      name: 'RSU Duta Mulya Majenang',
      type: 'Rumah Sakit Swasta Mitra BPJS',
      distanceKm: 13.8,
      travelTimeMin: 20,
      status: 'Terhubung SISRUTE',
      specialties: ['Pelayanan Trauma Bedah', 'Perinatologi', 'CT-Scan'],
    },
    {
      name: 'RSUD Cilacap',
      type: 'Rumah Sakit Rujukan Wilayah (Tipe B)',
      distanceKm: 74.0,
      travelTimeMin: 95,
      status: 'Rujukan Sub-Spesialistik',
      specialties: ['Kateterisasi Jantung (Cathlab)', 'Bedah Saraf', 'Hemodialisa Cito'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white border border-teal-800/50 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-radial from-teal-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              Radius Jangkauan Pelayanan IGD
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pemetaan Wilayah Kerja Puskesmas Wanareja II
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Memantau jejaring rujukan darurat, persebaran kasus kegawatdaruratan 7 desa binaan, serta integrasi Ambulans Siaga Desa & SISRUTE Kemenkes RI.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-teal-600/30 backdrop-blur-xs">
            <Ambulance className="w-8 h-8 text-teal-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Standby Armada</span>
              <span className="text-sm font-bold text-white">2 Unit Ambulans Gawat Darurat</span>
              <span className="text-[11px] block text-emerald-400">Response Time Target: &lt; 15 mnt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map & Village Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Visual Radar & Network Map (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <NavIcon className="w-4 h-4 text-teal-600" />
                <span>Simulasi Radius Jangkauan Cito IGD Wanareja II</span>
              </h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                Pusat: Kantor PKM Wanareja II
              </span>
            </div>

            {/* Radar Diagram Container */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden border border-teal-900/60 p-4 flex items-center justify-center shadow-inner">
              {/* Radar Grid Circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* 10km circle */}
                <div className="w-[88%] h-[88%] rounded-full border border-teal-500/20 flex items-start justify-center pt-2">
                  <span className="text-[9px] text-teal-400/60 font-mono">Radius 10 km (Zone 3)</span>
                </div>
                {/* 6km circle */}
                <div className="absolute w-[60%] h-[60%] rounded-full border border-teal-500/30 flex items-start justify-center pt-2">
                  <span className="text-[9px] text-teal-400/70 font-mono">Radius 6 km (Zone 2)</span>
                </div>
                {/* 3km circle */}
                <div className="absolute w-[32%] h-[32%] rounded-full border border-teal-500/50 flex items-start justify-center pt-1">
                  <span className="text-[9px] text-teal-300 font-mono font-bold">3 km (Zone 1)</span>
                </div>
                {/* Crosshairs */}
                <div className="absolute w-full h-[1px] bg-teal-500/15" />
                <div className="absolute h-full w-[1px] bg-teal-500/15" />
              </div>

              {/* Center Puskesmas Node */}
              <div className="relative z-20 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-bold border border-emerald-400/50 whitespace-nowrap">
                  PKM WANAREJA II
                </span>
              </div>

              {/* Village Nodes on Radar */}
              {VILLAGE_COVERAGE.map((village, index) => {
                // Circular layout around center
                const angles = [45, 120, 180, 230, 290, 330, 80];
                const angle = angles[index % angles.length];
                const rad = (angle * Math.PI) / 180;
                // Distance percentage from center (scale max 10km to 40%)
                const distPercent = Math.min(42, Math.max(12, (village.distanceKm / 10) * 38));
                const left = 50 + Math.cos(rad) * distPercent;
                const top = 50 + Math.sin(rad) * distPercent;
                const isSelected = selectedVillage.name === village.name;

                return (
                  <button
                    key={village.name}
                    onClick={() => setSelectedVillage(village)}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 ${
                      isSelected ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition shadow-md ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 scale-110'
                          : village.activeCases > 0
                          ? 'bg-teal-500 text-white ring-2 ring-teal-300'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span
                      className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-900/90 text-slate-200 border border-slate-700 group-hover:text-white'
                      }`}
                    >
                      {village.name.replace('Desa ', '')} ({village.distanceKm} km)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Village Detail Footer Card */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{selectedVillage.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                  {selectedVillage.distanceKm} km dari Puskesmas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimasi waktu tempuh ambulans: <strong>~{selectedVillage.estimatedArrivalMin} menit</strong> • Kontak Kader: {selectedVillage.contactKader}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold">
                {selectedVillage.totalMonthlyCases} Pasien Bln Ini
              </span>
            </div>
          </div>
        </div>

        {/* Right: Village List & Referral Network (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Villages List with Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Daftar 7 Desa Wilayah Binaan</span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => setFilterRadius('ALL')}
                  className={`px-2 py-1 rounded font-semibold transition ${
                    filterRadius === 'ALL' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterRadius('NEAR')}
                  className={`px-2 py-1 rounded font-semibold transition ${
                    filterRadius === 'NEAR' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  &le; 5 km
                </button>
                <button
                  onClick={() => setFilterRadius('FAR')}
                  className={`px-2 py-1 rounded font-semibold transition ${
                    filterRadius === 'FAR' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  &gt; 5 km
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {filteredVillages.map((village) => {
                const isSelected = selectedVillage.name === village.name;
                return (
                  <button
                    key={village.name}
                    onClick={() => setSelectedVillage(village)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{village.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          ~{village.estimatedArrivalMin} mnt
                        </span>
                        <span>•</span>
                        <span>{village.distanceKm} km</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                        {village.totalMonthlyCases} kunjungan
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Referral Hospital Network Card (SISRUTE) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-rose-600" />
                <span>Jejaring Rujukan SISRUTE Kemenkes</span>
              </h3>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Online Siaga
              </span>
            </div>

            <div className="space-y-2.5">
              {referralHospitals.map((hosp) => (
                <div key={hosp.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{hosp.name}</h4>
                    <span className="text-[11px] font-mono text-teal-700 font-semibold">
                      {hosp.distanceKm} km (~{hosp.travelTimeMin} mnt)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{hosp.type}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hosp.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
