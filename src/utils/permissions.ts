import type { UserRole } from '../types/auth';

export function canManageRecords(role: UserRole): boolean {
  return role === 'operator';
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'operator';
}

export function canExportOrPrint(_role: UserRole): boolean {
  return true;
}

export function getRoleLabel(role: UserRole): string {
  return role === 'operator' ? 'Operator' : 'Pengguna';
}

export function getRoleDescription(role: UserRole): string {
  return role === 'operator'
    ? 'Akses penuh registrasi pasien IGD, pembaruan rawat inap, ekspor data, dan manajemen akun.'
    : 'Akses pemantauan dashboard rekap, pencarian buku register, cetak, dan ekspor laporan (baca saja).';
}
