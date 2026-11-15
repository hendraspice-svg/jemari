import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { SheetTabsBar } from './components/SheetTabsBar';
import { DashboardRecap } from './components/DashboardRecap';
import { RawatInapRecapSheet } from './components/RawatInapRecapSheet';
import { PatientRegisterTable } from './components/PatientRegisterTable';
import { RawatInapRegisterTable } from './components/RawatInapRegisterTable';
import { RawatInapUpdateModal } from './components/RawatInapUpdateModal';
import { RegisterPatientFormModal } from './components/RegisterPatientFormModal';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { PatientRecord, PatientTrack } from './types/index';
import type { AuthUser } from './types/auth';
import { INITIAL_PATIENTS, INITIAL_PATIENT_RECORDS } from './data/initialData';
import { aggregateRawatInapRecap } from './utils/recap';
import { selectMaleVoiceIndex, getMaleSpeechConfig } from './utils/voice';
import { fetchCurrentUser, logoutSession } from './utils/authClient';
import { canManageRecords, canManageUsers } from './utils/permissions';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type SheetKind = 'igd' | 'rawat_inap';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const [records, setRecords] = useState<PatientRecord[]>(INITIAL_PATIENT_RECORDS);
  const [patients, setPatients] = useState<PatientTrack[]>(INITIAL_PATIENTS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('recap');
  const [recapSheet, setRecapSheet] = useState<SheetKind>('igd');
  const [registerSheet, setRegisterSheet] = useState<SheetKind>('igd');

  // Registration modals
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PatientRecord | null>(null);
  const [editingRanapRecord, setEditingRanapRecord] = useState<PatientRecord | null>(null);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'alert';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const userCanManageRecords = currentUser ? canManageRecords(currentUser.role) : false;
  const userCanManageUsers = currentUser ? canManageUsers(currentUser.role) : false;

  const showToast = useCallback(
    (
      text: string,
      type: 'success' | 'alert' = 'success',
      action?: { label: string; onClick: () => void }
    ) => {
      setToastMessage({
        text,
        type,
        actionLabel: action?.label,
        onAction: action?.onClick,
      });
      setTimeout(() => {
        setToastMessage(null);
      }, 5500);
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((user) => {
        if (mounted) setCurrentUser(user);
      })
      .finally(() => {
        if (mounted) setIsCheckingAuth(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Preload SpeechSynthesis voices & keyboard shortcut: F2 to open registration modal (Operator only)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        if (!currentUser || !canManageRecords(currentUser.role)) return;
        e.preventDefault();
        setEditingRecord(null);
        setIsRegisterFormOpen(true);
      } else if (e.key === 'Escape') {
        setIsRegisterFormOpen(false);
        setEditingRanapRecord(null);
        setIsUserManagementOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // Male voice queue announcement using Web Audio lower baritone chime + SpeechSynthesis
  const playAnnouncement = useCallback(() => {
    if (isAudioPlaying) return;
    setIsAudioPlaying(true);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const freqs = [261.63, 329.63, 392.0, 523.25];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.22, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.45);
        });
      }
    } catch {
      // Audio fallback
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const activePatient = records.find((r) => !r.excludeFromIgd) || records[0];
      const textToSpeak = activePatient
        ? `Perhatian. Pasien atas nama ${activePatient.namaPasien}${
            activePatient.noRm ? `, nomor rekam medis ${activePatient.noRm}` : ''
          }, harap segera menuju ruang tindakan IGD PUSKESMAS WANAREJA II.`
        : 'Perhatian. Panggilan antrean pasien IGD PUSKESMAS WANAREJA II.';

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const maleConfig = getMaleSpeechConfig();
      const voices = window.speechSynthesis.getVoices();
      const maleIdx = selectMaleVoiceIndex(voices);
      if (maleIdx >= 0 && voices[maleIdx]) {
        utterance.voice = voices[maleIdx];
      }
      utterance.lang = maleConfig.lang;
      utterance.pitch = maleConfig.pitch;
      utterance.rate = maleConfig.rate;
      utterance.volume = maleConfig.volume;

      const fallbackTimer = setTimeout(() => setIsAudioPlaying(false), 6000);
      utterance.onend = () => {
        clearTimeout(fallbackTimer);
        setIsAudioPlaying(false);
      };
      utterance.onerror = () => {
        clearTimeout(fallbackTimer);
        setIsAudioPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsAudioPlaying(false), 2000);
    }

    showToast('Memutar panggilan suara laki-laki antrean IGD...');
  }, [isAudioPlaying, records, showToast]);

  // Handle Save / Add / Edit Record in Register Table (Operator only)
  const handleSaveRecord = (savedRecord: PatientRecord) => {
    if (!userCanManageRecords) {
      showToast('Akses ditolak: hanya Operator yang dapat mengubah data register.', 'alert');
      return;
    }
    setRecords((prev) => {
      const existsIndex = prev.findIndex((r) => r.id === savedRecord.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = savedRecord;
        return copy;
      }
      return [savedRecord, ...prev];
    });

    const newTrack: PatientTrack = {
      id: savedRecord.id,
      registrationNumber: `IGD-${savedRecord.tanggalMasuk.replace(/-/g, '')}-${String(savedRecord.no).padStart(3, '0')}`,
      medicalRecordNumber: savedRecord.noRm,
      nik: savedRecord.nik,
      fullName: savedRecord.namaPasien,
      birthDate: `${new Date().getFullYear() - savedRecord.umur}-01-01`,
      age: savedRecord.umur,
      gender: savedRecord.jenisKelamin,
      phone: '0812-xxxx-xxxx',
      addressVillage: savedRecord.alamat.desa,
      rtRw: `RT ${savedRecord.alamat.rt} / RW ${savedRecord.alamat.rw}`,
      arrivalMethod: 'Sendiri',
      insurance: String(savedRecord.kategoriPembayaran).includes('BPJS') ? 'BPJS' : 'Umum',
      chiefComplaint: savedRecord.keluhanUtama || savedRecord.tindakanMedisUmum,
      triage: savedRecord.triage || 'P3',
      triageReason: `Triage ${savedRecord.triage} - ${savedRecord.statusKeluar}`,
      vitals: {
        systolic: 120,
        diastolic: 80,
        heartRate: 80,
        respiratoryRate: 20,
        temperature: 36.6,
        oxygenSaturation: 98,
        painScale: 2,
        gcs: 'E4V5M6 (15)',
        consciousness: 'Compos Mentis',
      },
      status: savedRecord.statusKeluar === 'Pulang Rawat Jalan' ? 'selesai' : 'triage',
      registeredAt: new Date().toISOString(),
      doctorInCharge: savedRecord.dokterJaga || 'dr. Hendra Prasetyo',
      nurseInCharge: 'Ns. Siti Rohmah, S.Kep',
      notes: [`Registrasi Buku Register: Tindakan "${savedRecord.tindakanMedisUmum}" (${savedRecord.statusKeluar})`],
    };

    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === savedRecord.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newTrack;
        return copy;
      }
      return [newTrack, ...prev];
    });

    const rmLabel = savedRecord.noRm ? ` (${savedRecord.noRm})` : '';
    if (savedRecord.statusKeluar === 'Rawat Inap Puskesmas') {
      const isAlreadyOnRanapRegister = activeTab === 'register' && registerSheet === 'rawat_inap';
      showToast(
        `Pasien ${savedRecord.namaPasien}${rmLabel} tersimpan & otomatis terekap ke Register Rawat Inap.`,
        'success',
        !isAlreadyOnRanapRegister
          ? {
              label: 'Buka Register Ranap',
              onClick: () => {
                setActiveTab('register');
                setRegisterSheet('rawat_inap');
              },
            }
          : undefined
      );
    } else {
      showToast(`Data pasien ${savedRecord.namaPasien}${rmLabel} berhasil disimpan.`);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (!userCanManageRecords) {
      showToast('Akses ditolak: hanya Operator yang dapat menghapus catatan.', 'alert');
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setPatients((prev) => prev.filter((p) => p.id !== id));
    showToast('Catatan pasien berhasil dihapus dari register.');
  };

  const handleEditRecord = (record: PatientRecord) => {
    if (!userCanManageRecords) return;
    setEditingRecord(record);
    setIsRegisterFormOpen(true);
  };

  const handleLogout = async () => {
    await logoutSession();
    setIsRegisterFormOpen(false);
    setEditingRecord(null);
    setEditingRanapRecord(null);
    setIsUserManagementOpen(false);
    setCurrentUser(null);
  };

  const igdRecords = useMemo(() => records.filter((r) => !r.excludeFromIgd), [records]);
  const rawatInapSummary = useMemo(() => aggregateRawatInapRecap(records, 'ALL'), [records]);
  const rawatInapCount = rawatInapSummary.totalRanap;
  const belumLengkapCount = rawatInapSummary.belumLengkapCount;

  const openRegisterRawatInap = () => {
    setActiveTab('register');
    setRegisterSheet('rawat_inap');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 text-center shadow-xs space-y-1">
          <p className="text-sm font-semibold text-slate-900">JEMARI IGD RANAP</p>
          <p className="text-xs text-slate-500">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('recap');
          showToast(
            `Selamat datang, ${user.fullName} (${user.role === 'operator' ? 'Operator' : 'Pengguna'}).`
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl bg-slate-900 text-white text-xs sm:text-sm border border-teal-500/50 animate-in slide-in-from-bottom-3 duration-200 max-w-md">
          {toastMessage.type === 'alert' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          {toastMessage.actionLabel && toastMessage.onAction && (
            <button
              type="button"
              onClick={() => {
                toastMessage.onAction?.();
                setToastMessage(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition"
            >
              {toastMessage.actionLabel}
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header with Logo Banner */}
      <Header
        patients={patients}
        currentUser={currentUser}
        canManageRecords={userCanManageRecords}
        onOpenRegister={() => {
          if (!userCanManageRecords) return;
          setEditingRecord(null);
          setIsRegisterFormOpen(true);
        }}
        onPlayAnnouncement={playAnnouncement}
        onOpenUserManagement={() => {
          if (!userCanManageUsers) return;
          setIsUserManagementOpen(true);
        }}
        onLogout={handleLogout}
        isAudioPlaying={isAudioPlaying}
      />

      {/* Primary Navigation Tabs: Dashboard Rekap (2 Sheet) & Register (2 Sheet) */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        totalRecordsCount={igdRecords.length}
        rawatInapCount={rawatInapCount}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* MENU 1: Dashboard Rekap (2 Sheet: Sheet IGD & Sheet Rawat Inap) */}
        {activeTab === 'recap' && (
          <>
            <SheetTabsBar
              workbookLabel="Dashboard Rekap"
              activeSheet={recapSheet}
              onSelectSheet={setRecapSheet}
              sheets={[
                {
                  id: 'igd',
                  label: 'IGD',
                  badge: `${igdRecords.length} Kunjungan`,
                  accent: 'teal',
                },
                {
                  id: 'rawat_inap',
                  label: 'Rawat Inap',
                  badge: `${rawatInapCount} Pasien`,
                  alertBadge: belumLengkapCount > 0 ? `${belumLengkapCount} Baru` : undefined,
                  accent: 'sky',
                },
              ]}
            />

            {recapSheet === 'igd' ? (
              <DashboardRecap
                records={records}
                canManageRecords={userCanManageRecords}
                onOpenAddModal={() => {
                  if (!userCanManageRecords) return;
                  setEditingRecord(null);
                  setIsRegisterFormOpen(true);
                }}
                onOpenRawatInapTab={() => setRecapSheet('rawat_inap')}
              />
            ) : (
              <RawatInapRecapSheet
                records={records}
                onOpenRegisterRawatInap={openRegisterRawatInap}
              />
            )}
          </>
        )}

        {/* MENU 2: Register (2 Sheet: Register IGD & Register Rawat Inap) */}
        {activeTab === 'register' && (
          <>
            <SheetTabsBar
              workbookLabel="Buku Register"
              activeSheet={registerSheet}
              onSelectSheet={setRegisterSheet}
              sheets={[
                {
                  id: 'igd',
                  label: 'Register IGD',
                  badge: `${igdRecords.length} Pasien`,
                  accent: 'teal',
                },
                {
                  id: 'rawat_inap',
                  label: 'Register Rawat Inap',
                  badge: `${rawatInapCount} Pasien`,
                  alertBadge: belumLengkapCount > 0 ? `${belumLengkapCount} Lengkapi` : undefined,
                  accent: 'sky',
                },
              ]}
            />

            {registerSheet === 'igd' ? (
              <PatientRegisterTable
                records={igdRecords}
                canManageRecords={userCanManageRecords}
                onOpenAddModal={() => {
                  if (!userCanManageRecords) return;
                  setEditingRecord(null);
                  setIsRegisterFormOpen(true);
                }}
                onEditRecord={handleEditRecord}
                onDeleteRecord={handleDeleteRecord}
                onOpenRawatInapTab={() => setRegisterSheet('rawat_inap')}
              />
            ) : (
              <RawatInapRegisterTable
                records={records}
                canManageRecords={userCanManageRecords}
                onEditRecord={(rec) => {
                  if (!userCanManageRecords) return;
                  setEditingRanapRecord(rec);
                }}
                onOpenRecapRawatInapSheet={() => {
                  setActiveTab('recap');
                  setRecapSheet('rawat_inap');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Formulir Registrasi Pasien IGD (Operator only) */}
      {userCanManageRecords && (
        <RegisterPatientFormModal
          isOpen={isRegisterFormOpen}
          onClose={() => {
            setIsRegisterFormOpen(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveRecord}
          editingRecord={editingRecord}
          totalRecordsCount={igdRecords.length}
        />
      )}

      {/* Modal Lengkapi Data Tambahan Rawat Inap (Operator only) */}
      {userCanManageRecords && (
        <RawatInapUpdateModal
          record={editingRanapRecord}
          onClose={() => setEditingRanapRecord(null)}
          onSave={(updated) => {
            handleSaveRecord(updated);
            showToast(`Data rawat inap ${updated.namaPasien} berhasil diperbarui.`);
          }}
          onOpenFullIgdEdit={handleEditRecord}
        />
      )}

      {/* Modal Manajemen Akun Operator & Pengguna (Operator only) */}
      {userCanManageUsers && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          currentUser={currentUser}
          onClose={() => setIsUserManagementOpen(false)}
          onNotify={(text, type = 'success') => showToast(text, type)}
        />
      )}

      {/* Footer Info */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 JEMARI IGD RANAP • PUSKESMAS WANAREJA II, Dinas Kesehatan Kabupaten Cilacap</p>
          <p className="text-slate-500">
            Sistem Registrasi Pasien IGD &amp; Rekapitulasi Perawatan Rawat Inap
          </p>
        </div>
      </footer>
    </div>
  );
}
