import { KategoriPembayaran, PatientRecord, StatusKeluarIGD, StatusPulangRanap, TriageCategory } from '../types/index';

// [noLabel, tanggalStr, namaPasien, umurStr, jkStr, desa, rt, rw, tindakan, pembayaran, nik, statusStr]
type RawIgdRow = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

// [noRanap, namaPasien, umur, jkStr, desa, rt, rw, diagnosa, masukTgl, masukJam, keluarTgl, keluarJam, jmlHariStr, pembayaran, nik, statusPulangStr]
type RawRanapRow = readonly [
  number,
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

const BULAN_MAP: Record<string, string> = {
  januari: '01',
  februari: '02',
  maret: '03',
  april: '04',
  mei: '05',
  juni: '06',
  juli: '07',
  agustus: '08',
  september: '09',
  oktober: '10',
  november: '11',
  desember: '12',
};

function parseIndoDate(dateStr: string): string {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return '';
  const day = parts[0].padStart(2, '0');
  const month = BULAN_MAP[parts[1].toLowerCase()] || '01';
  const year = parts[2];
  return `${year}-${month}-${day}`;
}

function normalizeTime(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t.includes(':') || t.includes('.')) {
    const sep = t.includes(':') ? ':' : '.';
    const [hStr, mStr = '0'] = t.split(sep);
    const h = hStr.padStart(2, '0');
    const m = mStr.length === 1 ? `${mStr}0` : mStr.padStart(2, '0');
    return `${h}:${m}`;
  }
  const hNum = parseInt(t, 10);
  if (!Number.isNaN(hNum)) {
    return `${String(hNum).padStart(2, '0')}:00`;
  }
  return undefined;
}

function mapStatusKeluar(raw: string): StatusKeluarIGD {
  const s = raw.trim().toLowerCase();
  if (s === 'rawat inap') return 'Rawat Inap Puskesmas';
  if (s === 'rujuk') return 'Rujuk RSUD / RS Lanjutan';
  if (s === 'meninggal') return 'Meninggal Dunia';
  return 'Pulang Rawat Jalan';
}

function mapStatusPulang(raw: string): StatusPulangRanap {
  const s = raw.trim().toUpperCase();
  if (!s) return 'Masih Dirawat';
  if (s === 'BLPL') return 'Pulang Sehat / Sembuh';
  if (s === 'RUJUK') return 'Rujuk RSUD / RS Lanjutan';
  if (s === 'APS') return 'Pulang APS';
  return 'Pulang Sehat / Sembuh';
}

function inferTriage(statusKeluar: StatusKeluarIGD, tindakan: string): TriageCategory {
  if (statusKeluar === 'Meninggal Dunia' || statusKeluar === 'Rujuk RSUD / RS Lanjutan') return 'P1';
  const t = tindakan.toLowerCase();
  if (t.includes('resusitasi') || t.includes('stabilisasi') || t.includes('penyakit jantung')) return 'P1';
  if (
    statusKeluar === 'Rawat Inap Puskesmas' ||
    t.includes('snake bite') ||
    t.includes('digigit') ||
    t.includes('kecelakaan') ||
    t.includes('jahit') ||
    t.includes('pemberian oksigen') ||
    t.includes('pemberiaan oksigen') ||
    t.includes('nebulizer')
  ) {
    return 'P2';
  }
  return 'P3';
}

function normalizeTindakan(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'Pemberiaan Oksigen') return 'Pemberian Oksigen';
  return trimmed;
}

function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace('KENI NOVIYANTI', 'KENI NOVIANTI')
    .replace('MUHAMAD FAJAR GUMELAR', 'MUHAMAD FADJAR GUMELAR')
    .replace('RIRIN SYIFA FAUZIA', 'RIRIN SYIFA')
    .replace('TUNGGAL SAPUTRA', 'TUNGGAL S')
    .replace('RUSMINI', 'RASMINI');
}

export const RAW_IGD_ROWS: RawIgdRow[] = [
  ['1', '01 September 2026', 'LASMINING PUTRI', '7', 'Perempuan', 'Tarisi', '1', '9', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'Umum', '', 'Berobat Jalan'],
  ['2', '02 September 2026', 'OSIYAH', '49', 'Perempuan', 'Tarisi', '3', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003420318363', 'Berobat Jalan'],
  ['3', '02 September 2026', 'ATTA ALA RIZKI', '7', 'Laki-laki', 'Bantar', '1', '14', 'Observasi', 'Umum', '', 'Berobat Jalan'],
  ['4', '02 September 2026', 'SUYANTO', '58', 'Laki-laki', 'Cilongkrang', '2', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['5', '02 September 2026', 'JUHRIAH', '54', 'Perempuan', 'Tarisi', '3', '7', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'Umum', '', 'Berobat Jalan'],
  ['6', '02 September 2026', 'DARIMIN', '63', 'Laki-laki', 'Purwasari', '', '', 'EKG', 'BPJS', '0000080926064', 'Berobat Jalan'],
  ['7', '03 September 2026', 'TOYIBAH', '65', 'Perempuan', 'Purwasari', '4', '6', 'Penatalaksanaan Tersengat/ Digigit Serangga', 'BPJS', '0003420272801', 'Berobat Jalan'],
  ['8', '03 September 2026', 'MIMIN SUMARNI', '51', 'Perempuan', 'Tarisi', '2', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002761303184', 'Berobat Jalan'],
  ['9', '03 September 2026', 'FARIAH', '42', 'Perempuan', 'Adimulya', '2', '15', 'Insisi Abses dll', 'BPJS', '0000507216306', 'Berobat Jalan'],
  ['10', '03 September 2026', 'ALFA BAYU PUTRA', '12', 'Laki-laki', 'Tarisi', '4', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002640914379', 'Berobat Jalan'],
  ['11', '03 September 2026', 'MISLAM', '62', 'Laki-laki', 'Bantar', '2', '16', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '0002702532688', 'Berobat Jalan'],
  ['12', '03 September 2026', 'M. ARIF W.', '7', 'Laki-laki', 'Tarisi', '5', '8', 'Jahit/ Lepas Jahit Luka', 'Umum', '', 'Berobat Jalan'],
  ['13', '03 September 2026', 'SETIAWAN', '49', 'Laki-laki', 'Sidamulya', '3', '8', 'Nebulizer', 'BPJS', '0001084940469', 'Berobat Jalan'],
  ['14', '04 September 2026', 'DIAH KARTIKA', '11', 'Perempuan', 'Tarisi', '', '', 'Nebulizer', 'BPJS', '', 'Berobat Jalan'],
  ['15', '04 September 2026', 'AMINUL B.', '7', 'Laki-laki', 'Sidamulya', '5', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['16', '04 September 2026', 'SITI AMIDAH', '70', 'Perempuan', 'Adimulya', '2', '10', 'EKG', 'BPJS', '', 'Berobat Jalan'],
  ['17', '04 September 2026', 'JUHRIYAH', '54', 'Perempuan', 'Tarisi', '', '', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['18', '04 September 2026', 'SLAMET', '49', 'Laki-laki', 'Purwasari', '4', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['19', '05 September 2026', 'WAHYAT H.', '63', 'Laki-laki', 'Bantar', '3', '3', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['20', '05 September 2026', 'ALVA BAYU PUTRA', '12', 'Laki-laki', 'Tarisi', '4', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['21', '05 September 2026', 'SUTIRAH', '54', 'Perempuan', 'Sidamulya', '5', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['22', '05 September 2026', 'MIMIN SUMARNI', '51', 'Perempuan', 'Tarisi', '2', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002761303184', 'Berobat Jalan'],
  ['23', '07 September 2026', 'UMMUL BAROKAH', '7', 'Perempuan', 'Sidamulya', '5', '7', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['24', '07 September 2026', 'TUSRIWATI', '63', 'Perempuan', 'Purwasari', '1', '5', 'EKG', 'BPJS', '0000516924775', 'Berobat Jalan'],
  ['25', '07 September 2026', 'MUSTAQIM', '55', 'Laki-laki', 'Cilongkrang', '4', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003420182338', 'Berobat Jalan'],
  ['26', '07 September 2026', 'SUTIRAH', '54', 'Perempuan', 'Sidamulya', '5', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['27', '07 September 2026', 'IRFAN N. H.', '19', 'Laki-laki', 'Cilongkrang', '2', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['28', '08 September 2026', 'SOIMAH', '58', 'Perempuan', 'Tarisi', '1', '8', 'Nebulizer', 'Umum', '3301154201680002', 'Berobat Jalan'],
  ['29', '08 September 2026', 'TIMBUL SUGITO', '76', 'Laki-laki', 'Tarisi', '2', '6', 'Nebulizer', 'BPJS', '', 'Berobat Jalan'],
  ['30', '08 September 2026', 'IIN CAHYANI', '70', 'Perempuan', 'Bantar', '2', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['31', '08 September 2026', 'TAKEM', '58', 'Perempuan', 'Bantar', '', '', 'Injeksi', 'BPJS', '0002261580333', 'Berobat Jalan'],
  ['32', '08 September 2026', 'CARTEM', '54', 'Perempuan', 'Tarisi', '3', '4', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['33', '08 September 2026', 'ALVA BAYU PUTRA', '12', 'Laki-laki', 'Tarisi', '4', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['34', '08 September 2026', 'SRI CAHYUNI', '35', 'Perempuan', 'Cilongkrang', '2', '5', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['35', '09 September 2026', 'MARSINAH', '63', 'Perempuan', 'Tarisi', '4', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002576830127', 'Berobat Jalan'],
  ['36', '09 September 2026', 'NAKEM', '72', 'Perempuan', 'Tarisi', '3', '3', 'Perawatan Luka, Ganti Balut', 'BPJS', '0000516680403', 'Berobat Jalan'],
  ['37', '09 September 2026', 'ADING ROHMAN IING ROHIM', '60', 'Laki-laki', 'Cilongkrang', '3', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003420250615', 'Berobat Jalan'],
  ['38', '09 September 2026', 'SAMINAH', '65', 'Perempuan', 'Bantar', '3', '14', 'EKG', 'BPJS', '0000516497387', 'Berobat Jalan'],
  ['39', '09 September 2026', 'UMMUL BAROKAH', '7', 'Perempuan', 'Sidamulya', '5', '7', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['40', '09 September 2026', 'NGADINAH', '66', 'Perempuan', 'Bantar', '1', '17', 'EKG', 'BPJS', '', 'Berobat Jalan'],
  ['41', '09 September 2026', 'MURTI', '58', 'Perempuan', 'Cilongkrang', '2', '2', 'Pasang Infus', 'BPJS', '0003420257051', 'Rawat Inap'],
  ['42', '09 September 2026', 'KASIYEM', '59', 'Perempuan', 'Cilongkrang', '2', '4', 'Pasang Infus', 'BPJS', '0001528180334', 'Rawat Inap'],
  ['43', '10 September 2026', 'NOERMA Y.', '26', 'Perempuan', 'Cilongkrang', '2', '2', 'Jahit/ Lepas Jahit Luka', 'BPJS', '', 'Berobat Jalan'],
  ['44', '10 September 2026', 'MARYANTO', '76', 'Laki-laki', 'Bantar', '3', '14', 'Pasang Infus', 'BPJS', '0002199535389', 'Rawat Inap'],
  ['45', '10 September 2026', 'TASIH', '69', 'Perempuan', 'Bantar', '3', '14', 'Pasang Infus', 'BPJS', '0002199538179', 'Rawat Inap'],
  ['46', '11 September 2026', 'MURSINAH', '63', 'Perempuan', 'Tarisi', '4', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002576830127', 'Berobat Jalan'],
  ['47', '11 September 2026', 'IIN CAHYANI', '70', 'Perempuan', 'Bantar', '', '', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002576241977', 'Berobat Jalan'],
  ['48', '11 September 2026', 'AZKA ALVIAN PRATAMA', '8', 'Laki-laki', 'Tarisi', '5', '1', 'Perawatan Luka, Ganti Balut', 'Umum', '3301150412170003', 'Berobat Jalan'],
  ['49', '11 September 2026', "PARTO UTOMO AL NGA'AD", '85', 'Laki-laki', 'Bantar', '3', '8', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '0000517392922', 'Berobat Jalan'],
  ['50', '17 September 2026', 'BRINA ELSIA SHAFIRA', '7', 'Perempuan', 'Cilongkrang', '2', '11', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002908547548', 'Berobat Jalan'],
  ['51', '17 September 2026', 'WISNU JULI SETIAWAN', '29', 'Laki-laki', 'Bantar', '2', '15', 'Jahit/ Lepas Jahit Luka', 'Umum', '', 'Berobat Jalan'],
  ['52', '17 September 2026', 'TUGIRAH', '54', 'Perempuan', 'Cilongkrang', '4', '4', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '0000517174648', 'Berobat Jalan'],
  ['53', '17 September 2026', 'ARUMI RAHMATUL H', '13', 'Perempuan', 'Tarisi', '1', '3', 'Observasi', 'BPJS', '0003420318609', 'Berobat Jalan'],
  ['54', '17 September 2026', 'MADSALIM AL NGIMUN', '70', 'Laki-laki', 'Tarisi', '4', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '0000518069395', 'Berobat Jalan'],
  ['55', '17 September 2026', 'SUWARNO YATIMIN', '67', 'Laki-laki', 'Cilongkrang', '1', '1', 'Pasang Infus', 'BPJS', '0003545258499', 'Rawat Inap'],
  ['56', '17 September 2026', 'IRFANI IRMAWATI', '34', 'Perempuan', 'Adimulya', '2', '12', 'Pasang Infus', 'Umum', '3301154801920003', 'Rawat Inap'],
  ['57', '17 September 2026', 'SUWARNO YATIMIN', '67', 'Laki-laki', 'Cilongkrang', '1', '1', 'Pasang Infus', 'BPJS', '3301150201590001', 'Rawat Inap'],
  ['58', '17 September 2026', 'TUKIYEM', '74', 'Perempuan', 'Tarisi', '4', '3', 'Pasang Infus', 'BPJS', '3301155709520002', 'Rawat Inap'],
  ['59', '17 September 2026', 'RIRIN SYIFA FAUZIA', '19', 'Perempuan', 'Bantar', '1', '15', 'Pasang Infus', 'Umum', '3301156905070001', 'Rawat Inap'],
  ['60', '18 September 2026', 'ALENA NOVITASARI', '5', 'Perempuan', 'Tarisi', '3', '4', 'Perawatan Luka, Ganti Balut', 'Umum', '3301154601210003', 'Berobat Jalan'],
  ['61', '18 September 2026', 'IIN CAHYANI', '70', 'Perempuan', 'Bantar', '2', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002576241977', 'Berobat Jalan'],
  ['62', '18 September 2026', 'TURIJAH', '61', 'Perempuan', 'Sidamulya', '6', '7', 'Injeksi', 'Umum', '33011560005650002', 'Berobat Jalan'],
  ['63', '19 September 2026', 'MADSALIM AL NGIMUN', '70', 'Laki-laki', 'Tarisi', '4', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '0000518069395', 'Berobat Jalan'],
  ['64', '19 September 2026', 'BRINA ELSIA SHAFIRA', '7', 'Perempuan', 'Cilongkrang', '4', '4', 'Perawatan Luka, Ganti Balut', 'Umum', '3301154811180002', 'Berobat Jalan'],
  ['65', '20 September 2026', 'AHMAD SAPUTRA', '16', 'Laki-laki', 'Cilongkrang', '3', '4', 'Pasang Infus', 'Umum', '', 'Rawat Inap'],
  ['66', '20 September 2026', 'ALIFAH NURUL HIDAYAH', '15', 'Perempuan', 'Cilongkrang', '3', '5', 'Observasi', 'BPJS', '0003420320062', 'Berobat Jalan'],
  ['67', '20 September 2026', 'NABHAN ALGHANI', '12', 'Laki-laki', 'Tarisi', '3', '9', 'Anamnesis', 'BPJS', '0002093592903', 'Rawat Inap'],
  ['68', '21 September 2026', 'SEP CAHYONO', '24', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003446127977', 'Berobat Jalan'],
  ['69', '21 September 2026', 'BRINA ELSIA SHAFIRA', '7', 'Perempuan', 'Cilongkrang', '2', '11', 'Perawatan Luka, Ganti Balut', 'Umum', '3301154811180002', 'Berobat Jalan'],
  ['70', '21 September 2026', 'ALENA NOVITASARI', '5', 'Perempuan', 'Tarisi', '3', '4', 'Perawatan Luka, Ganti Balut', 'Umum', '3301154601210003', 'Berobat Jalan'],
  ['71', '21 September 2026', 'SUWARTI', '81', 'Perempuan', 'Cilongkrang', '3', '2', 'Perawatan Luka, Ganti Balut', 'BPJS', '0000081470643', 'Berobat Jalan'],
  ['72', '21 September 2026', 'RUSMIDI', '55', 'Laki-laki', 'Bantar', '3', '12', 'Perawatan Luka, Ganti Balut', 'Umum', '3301152309700001', 'Berobat Jalan'],
  ['73', '21 September 2026', 'MUALIM', '31', 'Laki-laki', 'Tarisi', '2', '2', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '0002398414206', 'Berobat Jalan'],
  ['74', '21 September 2026', 'SUKIRMAN', '68', 'Laki-laki', 'Purwasari', '1', '6', 'Pasang Infus', 'BPJS', '0003420223547', 'Rawat Inap'],
  ['75', '22 September 2026', 'HAMDAN', '49', 'Laki-laki', 'Tarisi', '3', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150207770003', 'Berobat Jalan'],
  ['76', '22 September 2026', 'JONI LUTFI', '32', 'Laki-laki', 'Tarisi', '2', '6', 'Insisi Abses dll', 'Umum', '3301152511930001', 'Berobat Jalan'],
  ['77', '22 September 2026', 'DIYAH', '71', 'Perempuan', 'Tarisi', '1', '1', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301156811540001', 'Berobat Jalan'],
  ['78', '22 September 2026', 'WAKIDI', '74', 'Laki-laki', 'Tarisi', '2', '15', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301153008520001', 'Berobat Jalan'],
  ['79', '22 September 2026', 'RINDU ANGGRAENI', '17', 'Perempuan', 'Adimulya', '1', '10', 'Pasang Infus', 'BPJS', '3301154302090001', 'Rawat Inap'],
  ['80', '22 September 2026', 'RESKYRAY EFETTRIK', '20', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002600425271', 'Berobat Jalan'],
  ['81', '22 September 2026', 'BRINA ELYSIA SHAFIRA', '7', 'Perempuan', 'Cilongkrang', '3', '2', 'Jahit/ Lepas Jahit Luka', 'Umum', '3301154811180002', 'Berobat Jalan'],
  ['82', '22 September 2026', 'TIARA RISMA WATI', '5', 'Perempuan', 'Tarisi', '2', '1', 'Pasang Infus', 'BPJS', '0003811188734', 'Rawat Inap'],
  ['83', '23 September 2026', 'WASILAH', '48', 'Perempuan', 'Tarisi', '2', '7', 'Pasang Infus', 'BPJS', '3301154407780004', 'Rawat Inap'],
  ['84', '24 September 2026', 'SEP CAHYONO', '24', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['85', '24 September 2026', 'MARGONO', '50', 'Laki-laki', 'Bantar', '3', '16', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['86', '25 September 2026', 'HAMDAN', '49', 'Laki-laki', 'Tarisi', '3', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002640914728', 'Berobat Jalan'],
  ['87', '25 September 2026', 'RESKYRAY EFETRIK', '20', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151801060002', 'Berobat Jalan'],
  ['88', '25 September 2026', 'BAEHAKI', '52', 'Laki-laki', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002610218384', 'Berobat Jalan'],
  ['89', '26 September 2026', 'YASMAN DARWANTO', '79', 'Laki-laki', 'Cilongkrang', '2', '4', 'Resusitasi Jantung Paru (RJP)', 'BPJS', '0002774034224', 'Meninggal'],
  ['90', '26 September 2026', 'SEP CAHYONO', '25', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003446127977', 'Berobat Jalan'],
  ['91', '26 September 2026', 'HAFFID', '6', 'Laki-laki', 'Cilongkrang', '', '', 'Pasang Infus', 'Umum', '', 'Berobat Jalan'],
  ['92', '26 September 2026', 'MISKEM', '66', 'Perempuan', 'Tarisi', '3', '1', 'Observasi', 'Umum', '', 'Rawat Inap'],
  ['93', '26 September 2026', 'JIHAN ANGGI YANI', '28', 'Perempuan', 'Cilongkrang', '1', '6', 'Pasang Infus', 'Umum', '', 'Rawat Inap'],
  ['94', '28 September 2026', 'HAMDAN', '49', 'Laki-laki', 'Tarisi', '3', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002640914728', 'Berobat Jalan'],
  ['95', '28 September 2026', 'AZZURA QURRATU Q', '7', 'Perempuan', 'Tarisi', '4', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003564211555', 'Berobat Jalan'],
  ['96', '28 September 2026', 'SUYONO', '65', 'Laki-laki', 'Bantar', '3', '9', 'Pasang Infus', 'BPJS', '0003333390636', 'Rawat Inap'],
  ['97', '28 September 2026', 'SUGINI', '49', 'Perempuan', 'Adimulya', '1', '8', 'EKG', 'BPJS', '0003553595853', 'Berobat Jalan'],
  ['98', '28 September 2026', 'RESKYRAY EFETRIK', '20', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'Umum', '3301151801060002', 'Berobat Jalan'],
  ['99', '28 September 2026', 'MISBAH AL BAHRUDIN', '63', 'Laki-laki', 'Tarisi', '3', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '0002769291742', 'Berobat Jalan'],
  ['100', '28 September 2026', 'SUTARNO', '56', 'Laki-laki', 'Tarisi', '3', '1', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['101', '28 September 2026', 'WARIS', '46', 'Laki-laki', 'Bantar', '3', '8', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '00005165999829', 'Berobat Jalan'],
  ['102', '29 September 2026', 'RANTI', '58', 'Perempuan', 'Purwasari', '2', '6', 'Pasang Infus', 'BPJS', '0002641228492', 'Rawat Inap'],
  ['103', '29 September 2026', 'TANGGUH WIJAYA', '10', 'Laki-laki', 'Luar Wilayah', '4', '4', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'Umum', '', 'Berobat Jalan'],
  ['104', '29 September 2026', 'KOMSIYAH', '54', 'Perempuan', 'Cilongkrang', '3', '4', 'EKG', 'BPJS', '0001168417012', 'Berobat Jalan'],
  ['105', '29 September 2026', 'SAMINEM', '70', 'Perempuan', 'Tarisi', '3', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '0000516946847', 'Berobat Jalan'],
  ['106', '29 September 2026', 'SEP CAHYONO', '25', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '0003446127977', 'Berobat Jalan'],
  ['107', '29 September 2026', 'RODIYAH', '35', 'Perempuan', 'Tarisi', '3', '8', 'Pasang Infus', 'BPJS', '3301154906910004', 'Rawat Inap'],
  ['108', '30 September 2026', 'RESKYRAY EFETRIK', '20', 'Laki-laki', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'Umum', '3301151801060002', 'Berobat Jalan'],
  ['109', '30 September 2026', 'UMINAH', '72', 'Perempuan', 'Tarisi', '2', '7', 'EKG', 'BPJS', '0002073492786', 'Berobat Jalan'],
  ['110', '30 September 2026', 'DIAH', '57', 'Perempuan', 'Adimulya', '4', '7', 'Pasang Infus', 'BPJS', '3301157112680003', 'Rawat Inap'],
  ['111', '30 September 2026', 'TASIYAH', '51', 'Perempuan', 'Bantar', '3', '3', 'Pasang Infus', 'BPJS', '3301154106750004', 'Rawat Inap'],
  ['112', '30 September 2026', 'MULYADI', '19', 'Laki-laki', 'Purwasari', '6', '4', 'Observasi', 'BPJS', '3301152512060001', 'Berobat Jalan'],
  ['113', '01 Oktober 2026', 'SAMAN', '66', 'Laki-laki', 'Cilongkrang', '2', '1', 'Pasang Infus', 'BPJS', '3301150309600002', 'Rawat Inap'],
  ['114', '01 Oktober 2026', 'SARING WARDONO', '54', 'Laki-laki', 'Cilongkrang', '2', '4', 'Pasang Infus', 'BPJS', '3301151404720005', 'Rawat Inap'],
  ['115', '01 Oktober 2026', 'KUSLAN', '47', 'Laki-laki', 'Tarisi', '4', '4', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3301150204790001', 'Berobat Jalan'],
  ['116', '01 Oktober 2026', 'MISBAH AL BAHRUDIN', '63', 'Laki-laki', 'Tarisi', '3', '8', 'Perawatan Luka, Ganti Balut', 'Umum', '3301150101630025', 'Berobat Jalan'],
  ['117', '01 Oktober 2026', 'RIZKI RAMADANI', '17', 'Laki-laki', 'Purwasari', '2', '3', 'Pasang Infus', 'BPJS', '3301152508090002', 'Rawat Inap'],
  ['118', '02 Oktober 2026', 'OMOH SALAMAH', '76', 'Perempuan', 'Cilongkrang', '3', '2', 'Pasang Infus', 'BPJS', '3301154609500003', 'Rawat Inap'],
  ['119', '02 Oktober 2026', 'RUSMIYATI', '73', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155207530001', 'Berobat Jalan'],
  ['120', '02 Oktober 2026', 'SAMINEM', '70', 'Perempuan', 'Tarisi', '3', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156411550001', 'Berobat Jalan'],
  ['121', '02 Oktober 2026', 'MASRURI', '52', 'Laki-laki', 'Bantar', '2', '13', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150101740014', 'Berobat Jalan'],
  ['122', '02 Oktober 2026', 'RENITA', '22', 'Perempuan', 'Tarisi', '3', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154702040003', 'Berobat Jalan'],
  ['123', '02 Oktober 2026', 'JAMATUN SOLIHIN', '29', 'Laki-laki', 'Luar Wilayah', '', '', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['124', '02 Oktober 2026', 'SEP CAHYONO', '25', 'Laki-laki', 'Tarisi', '1', '9', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3301152509010002', 'Berobat Jalan'],
  ['125', '02 Oktober 2026', 'MURTINAH', '70', 'Perempuan', 'Purwasari', '5', '3', 'Pasang Infus', 'Umum', '3301154304560003', 'Rawat Inap'],
  ['126', '02 Oktober 2026', 'SAMINGUN', '77', 'Laki-laki', 'Bantar', '1', '1', 'Pasang Infus', 'BPJS', '3301150904490001', 'Rawat Inap'],
  ['127', '03 Oktober 2026', 'FIORENTINA MELINDA', '24', 'Perempuan', 'Cilongkrang', '3', '3', 'Perawatan Luka, Ganti Balut', 'Umum', '3301155909020001', 'Berobat Jalan'],
  ['128', '03 Oktober 2026', 'KHOMYATI', '55', 'Perempuan', 'Bantar', '1', '2', 'Pasang Infus', 'BPJS', '3301155207710005', 'Rawat Inap'],
  ['129', '03 Oktober 2026', 'PARSINAH', '81', 'Perempuan', 'Bantar', '1', '2', 'Pasang Infus', 'BPJS', '3301154711440001', 'Rawat Inap'],
  ['130', '03 Oktober 2026', 'ROMLAH', '64', 'Perempuan', 'Purwasari', '4', '5', 'Observasi', 'BPJS', '0002576241246', 'Berobat Jalan'],
  ['131', '04 Oktober 2026', 'USEP ROMLI', '61', 'Laki-laki', 'Tarisi', '3', '5', 'Pasang Infus', 'BPJS', '3301151309650002', 'Rawat Inap'],
  ['132', '04 Oktober 2026', 'RAMINAH', '69', 'Perempuan', 'Purwasari', '1', '5', 'Pasang Infus', 'Umum', '3301155312560002', 'Rawat Inap'],
  ['133', '04 Oktober 2026', 'AISYAH AZKIYA CHAYRA', '5', 'Perempuan', 'Cilongkrang', '3', '1', 'Pasang Infus', 'BPJS', '3301157004210001', 'Rawat Inap'],
  ['134', '04 Oktober 2026', 'SUYATNO', '33', 'Laki-laki', 'Bantar', '2', '10', 'Pasang Infus', 'BPJS', '3301151608930002', 'Rawat Inap'],
  ['135', '05 Oktober 2026', 'RUSMIYATI', '73', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155207530001', 'Berobat Jalan'],
  ['136', '05 Oktober 2026', 'SLAMET', '32', 'Laki-laki', 'Adimulya', '2', '6', 'EKG', 'BPJS', '3301150104940002', 'Berobat Jalan'],
  ['137', '05 Oktober 2026', 'RESKYRAY EFETRIK', '20', 'Laki-laki', 'Tarisi', '1', '9', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3301151801060002', 'Berobat Jalan'],
  ['138', '05 Oktober 2026', 'ASHEEQA AMANIA ZIDNI', '6', 'Perempuan', 'Tarisi', '4', '6', 'Pasang Infus', 'Umum', '3301155107200003', 'Rawat Inap'],
  ['139', '05 Oktober 2026', 'SARING WARDONO', '54', 'Laki-laki', 'Cilongkrang', '2', '4', 'Penatalaksanaan Digigit Ular (Snake Bite)', 'BPJS', '3301151404720005', 'Berobat Jalan'],
  ['140', '05 Oktober 2026', 'KUSLAN', '47', 'Laki-laki', 'Tarisi', '4', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150204790001', 'Berobat Jalan'],
  ['141', '05 Oktober 2026', 'JARIYAH', '59', 'Perempuan', 'Tarisi', '3', '7', 'Pasang Infus', 'BPJS', '3301155006670003', 'Rawat Inap'],
  ['142', '06 Oktober 2026', 'HAYATUL HUSNA', '15', 'Perempuan', 'Cilongkrang', '4', '5', 'Pasang Infus', 'BPJS', '3301156704110001', 'Rawat Inap'],
  ['143', '06 Oktober 2026', 'DARMONO', '32', 'Laki-laki', 'Luar Wilayah', '3', '3', 'Pasang Infus', 'BPJS', '3301182904940005', 'Rawat Inap'],
  ['144', '06 Oktober 2026', 'ANDREAN NUR FAUZI', '9', 'Laki-laki', 'Luar Wilayah', '', '', 'Observasi', 'BPJS', '3301127021700003', 'Berobat Jalan'],
  ['145', '06 Oktober 2026', 'WENI ANGGI ANGGRAENI', '53', 'Perempuan', 'Tarisi', '4', '1', 'Pasang Infus', 'BPJS', '3301156104730001', 'Rawat Inap'],
  ['146', '06 Oktober 2026', 'DASIKUN', '51', 'Laki-laki', 'Tarisi', '5', '6', 'Pasang Infus', 'BPJS', '3301151701750001', 'Rawat Inap'],
  ['147', '07 Oktober 2026', 'PAIMAN KOMARUDIN', '61', 'Laki-laki', 'Purwasari', '1', '6', 'Injeksi', 'BPJS', '3301153009650001', 'Berobat Jalan'],
  ['148', '07 Oktober 2026', 'MURYATI', '63', 'Perempuan', 'Tarisi', '4', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155306630002', 'Berobat Jalan'],
  ['149', '07 Oktober 2026', 'TRIYONO', '56', 'Laki-laki', 'Cilongkrang', '3', '2', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150308700003', 'Berobat Jalan'],
  ['150', '07 Oktober 2026', 'MUHAMMAD MIFTAKHUDIN', '12', 'Laki-laki', 'Bantar', '1', '12', 'Pasang Infus', 'BPJS', '3301151007140002', 'Rawat Inap'],
  ['151', '07 Oktober 2026', 'SUKARNO', '44', 'Laki-laki', 'Cilongkrang', '1', '4', 'Pasang Infus', 'Umum', '3301150212810001', 'Rawat Inap'],
  ['152', '08 Oktober 2026', 'DARSITO', '67', 'Laki-laki', 'Bantar', '3', '3', 'Pasang Infus', 'BPJS', '3301151107590003', 'Rawat Inap'],
  ['153', '08 Oktober 2026', 'RUSMIYATI', '73', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155207530001', 'Berobat Jalan'],
  ['154', '08 Oktober 2026', 'NAFA FADILAH', '11', 'Perempuan', 'Purwasari', '6', '3', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155505150002', 'Berobat Jalan'],
  ['155', '08 Oktober 2026', 'KARNO', '70', 'Laki-laki', 'Bantar', '3', '20', 'Pasang Infus', 'BPJS', '3301150712550001', 'Rawat Inap'],
  ['156', '08 Oktober 2026', 'MARDIAH', '61', 'Perempuan', 'Purwasari', '4', '6', 'Observasi', 'BPJS', '3301156206650001', 'Berobat Jalan'],
  ['157', '08 Oktober 2026', 'SUKARNO', '44', 'Laki-laki', 'Cilongkrang', '1', '4', 'Pasang Infus', 'BPJS', '3301150212810001', 'Rawat Inap'],
  ['158', '08 Oktober 2026', 'KINAH', '62', 'Perempuan', 'Tarisi', '2', '9', 'Pasang Infus', 'BPJS', '3301156507640002', 'Rawat Inap'],
  ['159', '08 Oktober 2026', 'KUSLAN', '47', 'Laki-laki', 'Tarisi', '4', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150204790001', 'Berobat Jalan'],
  ['160', '08 Oktober 2026', 'NICKA NIZAR RAKHMANSYAH', '30', 'Laki-laki', 'Luar Wilayah', '6', '2', 'Observasi', 'Umum', '3302142001960003', 'Berobat Jalan'],
  ['161', '08 Oktober 2026', 'WARJO', '72', 'Laki-laki', 'Cilongkrang', '3', '3', 'Pasang Infus', 'BPJS', '3301150712530002', 'Rawat Inap'],
  ['162', '08 Oktober 2026', 'HAFID KURNIAWAN', '8', 'Laki-laki', 'Luar Wilayah', '3', '1', 'Pasang Infus', 'BPJS', '3604242809180005', 'Rawat Inap'],
  ['163', '08 Oktober 2026', 'MAMAH', '61', 'Perempuan', 'Tarisi', '4', '9', 'Pasang Infus', 'BPJS', '3301155306650002', 'Rawat Inap'],
  ['164', '09 Oktober 2026', 'MOZA CILA SAKRINI', '11', 'Perempuan', 'Cilongkrang', '3', '6', 'Pasang Infus', 'BPJS', '3301154501150001', 'Rawat Inap'],
  ['165', '09 Oktober 2026', 'ETI KARYANTI', '54', 'Perempuan', 'Adimulya', '01', '02', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['166', '09 Oktober 2026', 'WAHIDATUN NURUL JANAH', '13', 'Perempuan', 'Bantar', '1', '12', 'Pasang Infus', 'BPJS', '3301155804130001', 'Rawat Inap'],
  ['167', '10 Oktober 2026', 'TRIYONO', '56', 'Laki-laki', 'Cilongkrang', '3', '2', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3301150308700003', 'Berobat Jalan'],
  ['168', '10 Oktober 2026', 'RASIMAN', '60', 'Laki-laki', 'Tarisi', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150205660004', 'Berobat Jalan'],
  ['169', '10 Oktober 2026', 'KENI NOVIANTI', '17', 'Perempuan', 'Bantar', '2', '8', 'Pasang Infus', 'BPJS', '3301155509090004', 'Rawat Inap'],
  ['170', '10 Oktober 2026', 'YUVI DEA', '21', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155506050003', 'Berobat Jalan'],
  ['171', '11 Oktober 2026', 'RASMAH', '67', 'Perempuan', 'Tarisi', '2', '1', 'Pasang Infus', 'BPJS', '3301154407590004', 'Rawat Inap'],
  ['172', '11 Oktober 2026', 'DESTA YANUAR ROHANI', '16', 'Laki-laki', 'Cilongkrang', '1', '5', 'Pasang Infus', 'Umum', '3301152712100005', 'Rawat Inap'],
  ['173', '12 Oktober 2026', 'RUSMIYATI', '73', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155207530001', 'Berobat Jalan'],
  ['174', '12 Oktober 2026', 'ARDANIO DWI', '9', 'Laki-laki', 'Adimulya', '3', '1', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150101170001', 'Berobat Jalan'],
  ['175', '12 Oktober 2026', 'AISHA AKIFA NUGROHO', '12', 'Perempuan', 'Bantar', '3', '3', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301156109140002', 'Berobat Jalan'],
  ['176', '12 Oktober 2026', 'ETI KARYANTI', '42', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['177', '12 Oktober 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '2', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['178', '12 Oktober 2026', 'SARWATI', '27', 'Perempuan', 'Tarisi', '4', '9', 'Insisi Abses dll', 'BPJS', '3301154910990006', 'Berobat Jalan'],
  ['179', '12 Oktober 2026', 'ALFAHRU DAFFA TRIADI', '6', 'Laki-laki', 'Tarisi', '3', '3', 'Perawatan Luka, Ganti Balut', 'Umum', '', 'Berobat Jalan'],
  ['180', '12 Oktober 2026', 'RIRIN SYIFA FAUZIA', '19', 'Perempuan', 'Bantar', '1', '15', 'Pasang Infus', 'BPJS', '3301156905070001', 'Rawat Inap'],
  ['181', '12 Oktober 2026', 'PARNO', '71', 'Laki-laki', 'Tarisi', '1', '4', 'Pasang Infus', 'BPJS', '3301152005550002', 'Rawat Inap'],
  ['182', '13 Oktober 2026', 'PARTIMAH', '66', 'Perempuan', 'Purwasari', '2', '6', 'Pasang Infus', 'Umum', '3301154301600004', 'Rawat Inap'],
  ['183', '13 Oktober 2026', 'SURONO WIJAYANTO', '30', 'Laki-laki', 'Bantar', '2', '6', 'Pasang Infus', 'BPJS', '3301151905960003', 'Rawat Inap'],
  ['184', '13 Oktober 2026', 'ATIKAH HUJAIMAH', '21', 'Perempuan', 'Tarisi', '3', '6', 'Pasang Infus', 'BPJS', '3301155101050004', 'Rawat Inap'],
  ['185', '13 Oktober 2026', 'JULI SANTOSO', '38', 'Laki-laki', 'Tarisi', '1', '8', 'EKG', 'Umum', '3301190607880001', 'Berobat Jalan'],
  ['186', '13 Oktober 2026', 'MARTO', '67', 'Laki-laki', 'Bantar', '3', '15', 'Pasang Infus', 'Umum', '3301152711580001', 'Rawat Inap'],
  ['187', '13 Oktober 2026', 'RAFKA SHAQUILLE ZHAFRAN', '9', 'Laki-laki', 'Tarisi', '4', '4', 'Pasang Infus', 'BPJS', '3301151703170002', 'Rawat Inap'],
  ['188', '13 Oktober 2026', 'FAKHIRA ZIA KHAIRINA', '7', 'Perempuan', 'Bantar', '2', '6', 'Penatalaksanaan Kecelakaan Lalu Lintas (KLL)', 'Umum', '', 'Berobat Jalan'],
  ['189', '14 Oktober 2026', 'WATINI', '60', 'Perempuan', 'Adimulya', '2', '16', 'Pasang Infus', 'BPJS', '3301156011650003', 'Rawat Inap'],
  ['190', '14 Oktober 2026', 'ARDANIO DWI', '9', 'Laki-laki', 'Adimulya', '3', '12', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150101170001', 'Berobat Jalan'],
  ['191', '14 Oktober 2026', 'MELIYA KUNTAMI', '39', 'Perempuan', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155110870004', 'Berobat Jalan'],
  ['192', '14 Oktober 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '5', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['193', '14 Oktober 2026', 'NUR ISKANDAR', '24', 'Laki-laki', 'Tarisi', '3', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151104020002', 'Berobat Jalan'],
  ['194', '14 Oktober 2026', 'FATIMAH', '29', 'Perempuan', 'Tarisi', '4', '4', 'EKG', 'BPJS', '3301154210970001', 'Berobat Jalan'],
  ['195', '14 Oktober 2026', 'ARTINAH', '76', 'Perempuan', 'Tarisi', '3', '2', 'Observasi', 'BPJS', '3301155104500001', 'Berobat Jalan'],
  ['196', '14 Oktober 2026', 'MAHMUDIYAH', '26', 'Laki-laki', 'Luar Wilayah', '', '', 'Observasi', 'Umum', '3301025709000003', 'Berobat Jalan'],
  ['197', '14 Oktober 2026', 'LASIAH', '59', 'Perempuan', 'Cilongkrang', '3', '1', 'Observasi', 'BPJS', '3301155002670002', 'Berobat Jalan'],
  ['198', '14 Oktober 2026', 'SUTOPO', '36', 'Laki-laki', 'Cilongkrang', '3', '1', 'Pasang Infus', 'BPJS', '3301152806900002', 'Rawat Inap'],
  ['199', '14 Oktober 2026', 'FAREL RAFANSYAH', '1', 'Laki-laki', 'Bantar', '1', '12', 'Pasang Infus', 'BPJS', '3301152811250002', 'Rawat Inap'],
  ['200', '14 Oktober 2026', 'CHINDYA NUR ALFIANI', '8', 'Perempuan', 'Bantar', '2', '3', 'Pasang Infus', 'BPJS', '3301155609180002', 'Rawat Inap'],
  ['201', '15 Oktober 2026', 'RUSMIYATI', '73', 'Perempuan', 'Tarisi', '1', '9', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155207530001', 'Berobat Jalan'],
  ['202', '15 Oktober 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['203', '15 Oktober 2026', 'KUSLAN', '46', 'Laki-laki', 'Tarisi', '4', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150204790001', 'Berobat Jalan'],
  ['204', '15 Oktober 2026', 'AAN ARIYANTO', '47', 'Laki-laki', 'Purwasari', '1', '5', 'Pasang Infus', 'BPJS', '3301152404790004', 'Rawat Inap'],
  ['205', '15 Oktober 2026', 'MUHAMAD FADJAR GUMELAR', '34', 'Laki-laki', 'Tarisi', '3', '2', 'Pasang Infus', 'BPJS', '3301152908920001', 'Rawat Inap'],
  ['206', '15 Oktober 2026', 'SURATMAN', '58', 'Laki-laki', 'Tarisi', '1', '7', 'Penatalaksanaan Kecelakaan Lalu Lintas (KLL)', 'Umum', '3301151003680005', 'Berobat Jalan'],
  ['207', '16 Oktober 2026', 'HENI', '61', 'Perempuan', 'Adimulya', '7', '2', 'EKG', 'BPJS', '3301154901650004', 'Berobat Jalan'],
  ['208', '16 Oktober 2026', 'ARSHAKA DWI ADNANI', '6 BLN', 'Laki-laki', 'Cilongkrang', '2', '1', 'Observasi', 'BPJS', '3301150804260003', 'Berobat Jalan'],
  ['209', '17 Oktober 2026', 'ISTINGANATUN', '25', 'Perempuan', 'Luar Wilayah', '5', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155311000002', 'Berobat Jalan'],
  ['210', '17 Oktober 2026', 'DEANDRA JULIAN ALVAREZ', '2', 'Laki-laki', 'Tarisi', '4', '4', 'Nebulizer', 'BPJS', '3301150407240002', 'Berobat Jalan'],
  ['211', '17 Oktober 2026', 'SITI ROBINGAH', '60', 'Perempuan', 'Cilongkrang', '4', '7', 'Pasang Infus', 'BPJS', '3301154401660001', 'Rawat Inap'],
  ['212', '17 Oktober 2026', 'ARIS PRASETYO', '15', 'Laki-laki', 'Bantar', '1', '9', 'Nebulizer', 'Umum', '', 'Berobat Jalan'],
  ['213', '18 Oktober 2026', 'SUDIONO', '50', 'Laki-laki', 'Cilongkrang', '3', '2', 'Pasang Infus', 'Umum', '3301150311750003', 'Rawat Inap'],
  ['214', '18 Oktober 2026', 'DARMIN AL MUHNI', '75', 'Laki-laki', 'Bantar', '1', '12', 'Pasang Infus', 'BPJS', '3301150202510002', 'Rawat Inap'],
  ['215', '18 Oktober 2026', 'RATIM MURJI', '56', 'Laki-laki', 'Tarisi', '5', '9', 'Pasang Infus', 'BPJS', '3301150507700007', 'Rawat Inap'],
  ['216', '18 Oktober 2026', 'WAGIRUN', '64', 'Laki-laki', 'Cilongkrang', '3', '7', 'Pasang Infus', 'BPJS', '3301150702620003', 'Rawat Inap'],
  ['217', '18 Oktober 2026', 'SYEHUDIN', '42', 'Laki-laki', 'Cilongkrang', '3', '7', 'Pasang Infus', 'BPJS', '3301182208840005', 'Rawat Inap'],
  ['218', '19 Oktober 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'Umum', '3301157108830004', 'Berobat Jalan'],
  ['219', '19 Oktober 2026', 'SAMINI', '68', 'Perempuan', 'Tarisi', '3', '9', 'Anamnesis', 'BPJS', '3301154608580003', 'Berobat Jalan'],
  ['220', '19 Oktober 2026', 'DEHAN FAUZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['221', '19 Oktober 2026', 'SUMIATIN', '70', 'Perempuan', 'Tarisi', '3', '1', 'Pasang Infus', 'BPJS', '3301154507560004', 'Rawat Inap'],
  ['222', '19 Oktober 2026', 'NASLIM', '72', 'Laki-laki', 'Purwasari', '5', '4', 'Pasang Infus', 'BPJS', '3301151206540001', 'Rawat Inap'],
  ['223', '19 Oktober 2026', 'ASIYAH', '54', 'Perempuan', 'Cilongkrang', '2', '7', 'Pasang Infus', 'BPJS', '3301156001720003', 'Rawat Inap'],
  ['224', '19 Oktober 2026', 'ANISAN', '65', 'Laki-laki', 'Tarisi', '2', '8', 'Pemberiaan Oksigen', 'Umum', '3301150605610003', 'Meninggal'],
  ['225', '19 Oktober 2026', 'MARDIAH', '61', 'Perempuan', 'Purwasari', '4', '6', 'Pasang Kateter', 'Umum', '3301156206650001', 'Berobat Jalan'],
  ['226', '20 Oktober 2026', 'DARSIMIN', '53', 'Laki-laki', 'Tarisi', '5', '5', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150101630048', 'Berobat Jalan'],
  ['227', '20 Oktober 2026', 'ISTINGANATUN', '25', 'Perempuan', 'Luar Wilayah', '', '', 'Anamnesis', 'BPJS', '3301155311000002', 'Berobat Jalan'],
  ['228', '21 Oktober 2026', 'MIRA WAHYUDIN', '66', 'Laki-laki', 'Tarisi', '3', '6', 'Pasang Infus', 'BPJS', '3301151400600001', 'Rawat Inap'],
  ['229', '21 Oktober 2026', 'MANISAH', '57', 'Perempuan', 'Tarisi', '3', '2', 'Pasang Infus', 'BPJS', '3301154101690007', 'Rawat Inap'],
  ['230', '22 Oktober 2026', 'ADE MARLIAH', '26', 'Perempuan', 'Bantar', '1', '17', 'Pasang Infus', 'Umum', '3301155503000003', 'Rawat Inap'],
  ['231', '22 Oktober 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Sidamulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['232', '22 Oktober 2026', 'SITI MAISAH', '66', 'Perempuan', 'Tarisi', '3', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155508600002', 'Berobat Jalan'],
  ['233', '22 Oktober 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['234', '22 Oktober 2026', 'MANISEM', '70', 'Perempuan', 'Tarisi', '4', '8', 'Pasang Infus', 'BPJS', '3301154205560006', 'Rawat Inap'],
  ['235', '22 Oktober 2026', 'AFRIAN DIMAS APRIYANTO', '7', 'Laki-laki', 'Luar Wilayah', '1', '2', 'Perawatan Luka, Ganti Balut', 'Umum', '3306112803190003', 'Berobat Jalan'],
  ['236', '22 Oktober 2026', 'DEDE SUDARTI', '61', 'Perempuan', 'Tarisi', '1', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155604650001', 'Berobat Jalan'],
  ['237', '22 Oktober 2026', 'MARKIM', '66', 'Laki-laki', 'Bantar', '3', '3', 'Pasang Infus', 'BPJS', '3301150203600004', 'Rawat Inap'],
  ['238', '22 Oktober 2026', 'DASMI', '50', 'Perempuan', 'Bantar', '2', '2', 'Pasang Infus', 'Umum', '3276104302760004', 'Rawat Inap'],
  ['239', '22 Oktober 2026', 'SRY RUSMIYATIN RAHAYU', '14', 'Perempuan', 'Tarisi', '2', '4', 'Pasang Infus', 'BPJS', '3301156410110001', 'Rawat Inap'],
  ['240', '23 Oktober 2026', 'DARIKIN', '50', 'Laki-laki', 'Tarisi', '2', '1', 'Nebulizer', 'BPJS', '3301152508760004', 'Berobat Jalan'],
  ['241', '23 Oktober 2026', 'DULHASIM ASIM', '75', 'Laki-laki', 'Tarisi', '1', '7', 'Pasang Infus', 'BPJS', '3301150101510042', 'Rawat Inap'],
  ['242', '23 Oktober 2026', 'BISMA BHUMI N', '9 BLN', 'Laki-laki', 'Purwasari', '3', '4', 'Pasang Infus', 'BPJS', '3301151001260001', 'Rawat Inap'],
  ['243', '23 Oktober 2026', 'MULYADI', '19', 'Laki-laki', 'Purwasari', '6', '4', 'Pemberiaan Oksigen', 'BPJS', '3301152512060001', 'Berobat Jalan'],
  ['244', '23 Oktober 2026', 'RADIT ADITIA P', '13', 'Laki-laki', 'Bantar', '4', '14', 'Pasang Infus', 'BPJS', '3301152603130001', 'Rawat Inap'],
  ['245', '24 Oktober 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['246', '24 Oktober 2026', 'SUTRISNO', '75', 'Laki-laki', 'Bantar', '2', '19', 'Pasang Infus', 'BPJS', '3301151508510002', 'Rawat Inap'],
  ['247', '25 Oktober 2026', 'SAEPUDIN', '57', 'Laki-laki', 'Cilongkrang', '4', '7', 'Pasang Infus', 'BPJS', '3207350304690001', 'Rawat Inap'],
  ['248', '25 Oktober 2026', 'MISMAN', '61', 'Laki-laki', 'Sidamulya', '3', '7', 'Pasang Infus', 'BPJS', '3301150511640001', 'Rawat Inap'],
  ['249', '25 Oktober 2026', 'YATIRAH', '66', 'Perempuan', 'Cilongkrang', '4', '4', 'Pasang Infus', 'BPJS', '3301156403600001', 'Rawat Inap'],
  ['250', '25 Oktober 2026', 'ROBINI', '74', 'Perempuan', 'Tarisi', '3', '6', 'Pasang Infus', 'BPJS', '3301155311510001', 'Rawat Inap'],
  ['251', '25 Oktober 2026', 'AHMAD ISMAIL', '39', 'Laki-laki', 'Bantar', '3', '5', 'Pasang Infus', 'BPJS', '3301150706870002', 'Rawat Inap'],
  ['252', '26 Oktober 2026', 'JONI LUTFI', '32', 'Laki-laki', 'Tarisi', '2', '6', 'Insisi Abses dll', 'Umum', '3301152511930001', 'Berobat Jalan'],
  ['253', '26 Oktober 2026', 'SAMIRAH', '62', 'Perempuan', 'Bantar', '3', '2', 'EKG', 'BPJS', '3301154404640005', 'Berobat Jalan'],
  ['254', '26 Oktober 2026', 'ISMAIL AKBAR', '44', 'Laki-laki', 'Adimulya', '1', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152202820003', 'Berobat Jalan'],
  ['255', '26 Oktober 2026', 'SULATI', '38', 'Perempuan', 'Cilongkrang', '1', '3', 'Observasi', 'BPJS', '3301154401880002', 'Berobat Jalan'],
  ['255', '26 Oktober 2026', 'EKO PRIYANTO', '31', 'Laki-laki', 'Purwasari', '6', '4', 'Pasang Infus', 'BPJS', '3301151004950005', 'Rawat Inap'],
  ['256', '27 Oktober 2026', 'SUHERSIH', '67', 'Perempuan', 'Bantar', '2', '14', 'Pasang Infus', 'BPJS', '1611064503590002', 'Rawat Inap'],
  ['257', '27 Oktober 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['258', '27 Oktober 2026', 'SALIYEM', '71', 'Perempuan', 'Purwasari', '3', '2', 'Pasang Infus', 'BPJS', '3301154107550003', 'Rawat Inap'],
  ['259', '27 Oktober 2026', 'RESTINA OKTAVIANI', '30', 'Perempuan', 'Sidamulya', '5', '7', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301154210960005', 'Berobat Jalan'],
  ['260', '28 Oktober 2026', 'PARIAH', '61', 'Perempuan', 'Tarisi', '3', '7', 'Pasang Infus', 'BPJS', '3301024307650008', 'Rawat Inap'],
  ['261', '28 Oktober 2026', 'CARTINI', '60', 'Perempuan', 'Bantar', '1', '2', 'Pasang Infus', 'Umum', '3301154409660002', 'Rawat Inap'],
  ['262', '28 Oktober 2026', 'WARDI SUKANDAR', '73', 'Laki-laki', 'Purwasari', '2', '3', 'Pasang Kateter', 'BPJS', '3301150203530002', 'Berobat Jalan'],
  ['263', '28 Oktober 2026', 'KISNO', '58', 'Laki-laki', 'Bantar', '2', '14', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301151907680003', 'Berobat Jalan'],
  ['264', '28 Oktober 2026', 'YASIRUN', '53', 'Laki-laki', 'Tarisi', '3', '12', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150101730005', 'Berobat Jalan'],
  ['265', '28 Oktober 2026', 'TRI WINDARI', '23', 'Perempuan', 'Luar Wilayah', '', '', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'Umum', '3301186712020002', 'Berobat Jalan'],
  ['266', '28 Oktober 2026', 'RASMINI', '48', 'Perempuan', 'Tarisi', '2', '8', 'Pasang Infus', 'BPJS', '3301157004780001', 'Rawat Inap'],
  ['267', '29 Oktober 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['268', '29 Oktober 2026', 'NISMAN', '66', 'Laki-laki', 'Cilongkrang', '2', '5', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150509600003', 'Berobat Jalan'],
  ['269', '29 Oktober 2026', 'NASIHIN', '62', 'Laki-laki', 'Sidamulya', '5', '7', 'Perawatan Luka, Ganti Balut', 'Umum', '3301151606740001', 'Berobat Jalan'],
  ['270', '29 Oktober 2026', 'ANANG HERMAWAN', '14', 'Laki-laki', 'Bantar', '3', '11', 'Observasi', 'Umum', '', 'Berobat Jalan'],
  ['271', '30 Oktober 2026', 'DEHAN F', '47', 'Laki-laki', 'Tarisi', '4', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['272', '30 Oktober 2026', 'SUSI SETIYAWATI', '36', 'Perempuan', 'Cilongkrang', '1', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '', 'Berobat Jalan'],
  ['273', '30 Oktober 2026', 'KHOTOBUL MUKSIN', '29', 'Laki-laki', 'Luar Wilayah', '2', '2', 'Pasang Infus', 'BPJS', '3301103108970007', 'Rawat Inap'],
  ['274', '31 Oktober 2026', 'BARRA ALFARISQI', '3', 'Laki-laki', 'Tarisi', '3', '6', 'Pasang Infus', 'Umum', '3301151211220002', 'Rawat Inap'],
  ['275', '31 Oktober 2026', 'KHUMARIYAH', '66', 'Perempuan', 'Cilongkrang', '3', '1', 'Pasang Infus', 'BPJS', '3301154604600001', 'Rawat Inap'],
  ['276', '01 November 2026', 'WASITO', '59', 'Laki-laki', 'Adimulya', '1', '9', 'Pasang Infus', 'BPJS', '3301151207670005', 'Rawat Inap'],
  ['277', '02 November 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['278', '02 November 2026', 'DEHAN FAUZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['279', '02 November 2026', 'SULIS SETIYANTI', '36', 'Perempuan', 'Cilongkrang', '1', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154707900001', 'Berobat Jalan'],
  ['280', '02 November 2026', 'WARTEM', '60', 'Perempuan', 'Tarisi', '', '', 'Injeksi', 'BPJS', '3301156512650002', 'Berobat Jalan'],
  ['281', '02 November 2026', 'DARTIWI', '41', 'Perempuan', 'Tarisi', '2', '4', 'Stabilisasi Pasien Gawat Darurat', 'Umum', '', 'Berobat Jalan'],
  ['282', '02 November 2026', 'SUYONO', '65', 'Laki-laki', 'Bantar', '3', '4', 'Pasang Infus', 'BPJS', '3301150409610002', 'Rawat Inap'],
  ['283', '02 November 2026', 'NIZAM', '8', 'Laki-laki', 'Cilongkrang', '3', '1', 'Pasang Infus', 'Umum', '', 'Rawat Inap'],
  ['284', '03 November 2026', "NAELUS SAA'DAH", '22', 'Perempuan', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156611030002', 'Berobat Jalan'],
  ['285', '03 November 2026', 'JAMAL ARIFIN', '70', 'Laki-laki', 'Cilongkrang', '2', '7', 'Pasang Infus', 'BPJS', '3301150805560002', 'Rawat Inap'],
  ['286', '03 November 2026', 'SAMINAH', '61', 'Perempuan', 'Tarisi', '4', '3', 'Pasang Infus', 'BPJS', '3301154907650006', 'Rawat Inap'],
  ['287', '03 November 2026', 'WASILAH', '48', 'Perempuan', 'Tarisi', '2', '7', 'Pasang Infus', 'BPJS', '3301154407780004', 'Rawat Inap'],
  ['288', '03 November 2026', 'HENI PURWATI', '63', 'Perempuan', 'Cilongkrang', '2', '7', 'Pasang Infus', 'BPJS', '3301156007630002', 'Rawat Inap'],
  ['289', '04 November 2026', 'NARJO', '71', 'Laki-laki', 'Tarisi', '4', '3', 'Pasang Infus', 'BPJS', '3301152509550001', 'Rawat Inap'],
  ['290', '04 November 2026', 'WARYO SAWIYAN', '63', 'Laki-laki', 'Tarisi', '4', '1', 'Insisi Abses dll', 'BPJS', '3301151305630002', 'Berobat Jalan'],
  ['291', '04 November 2026', 'DARSITO', '67', 'Laki-laki', 'Bantar', '3', '3', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301151107590003', 'Berobat Jalan'],
  ['292', '04 November 2026', 'HENDARTO', '61', 'Laki-laki', 'Cilongkrang', '1', '3', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151209650006', 'Berobat Jalan'],
  ['293', '04 November 2026', 'SULIS SETIYANTI', '36', 'Perempuan', 'Cilongkrang', '1', '4', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154707900001', 'Berobat Jalan'],
  ['293', '04 November 2026', 'LILI INDRIANI', '41', 'Perempuan', 'Cilongkrang', '1', '3', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155910850001', 'Berobat Jalan'],
  ['294', '04 November 2026', 'KARTINI', '51', 'Perempuan', 'Bantar', '3', '15', 'Pasang Infus', 'BPJS', '3301155206750004', 'Rawat Inap'],
  ['295', '05 November 2026', 'ETI KARYANTI', '43', 'Perempuan', 'Adimulya', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301157108830004', 'Berobat Jalan'],
  ['296', '05 November 2026', 'JUMINAH', '48', 'Perempuan', 'Bantar', '2', '7', 'Pasang Infus', 'BPJS', '3301154308780001', 'Rawat Inap'],
  ['297', '05 November 2026', 'DEHAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['298', '05 November 2026', 'SANAH', '61', 'Perempuan', 'Cilongkrang', '2', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155205650006', 'Berobat Jalan'],
  ['299', '05 November 2026', 'RIKI AGUSTIAN', '30', 'Laki-laki', 'Tarisi', '3', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3276052309960004', 'Berobat Jalan'],
  ['300', '05 November 2026', 'NENENG NURJANAH', '42', 'Perempuan', 'Bantar', '3', '13', 'Pasang Infus', 'BPJS', '3205194603830005', 'Rawat Inap'],
  ['301', '05 November 2026', 'SITI ROBINGAH', '60', 'Perempuan', 'Cilongkrang', '4', '7', 'Pasang Infus', 'BPJS', '3301154401660001', 'Rawat Inap'],
  ['302', '06 November 2026', 'WARYO SAWIYAN', '63', 'Laki-laki', 'Luar Wilayah', '4', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150404500001', 'Berobat Jalan'],
  ['303', '06 November 2026', 'TIMBUL SUGITO', '76', 'Laki-laki', 'Tarisi', '2', '6', 'Nebulizer', 'BPJS', '3301150404500001', 'Berobat Jalan'],
  ['304', '06 November 2026', 'ANANDA WILDAN PRADITA', '12', 'Laki-laki', 'Sidamulya', '2', '15', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301153009140002', 'Berobat Jalan'],
  ['305', '06 November 2026', 'SELVI RETIARA', '17', 'Perempuan', 'Bantar', '', '', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '', 'Berobat Jalan'],
  ['306', '06 November 2026', 'SAMIDI', '46', 'Laki-laki', 'Bantar', '2', '15', 'EKG', 'BPJS', '3301150611800002', 'Berobat Jalan'],
  ['307', '06 November 2026', 'SEPI', '61', 'Perempuan', 'Purwasari', '3', '1', 'EKG', 'BPJS', '3301154102650008', 'Berobat Jalan'],
  ['308', '06 November 2026', 'DEHAN FAOZAN', '47', 'Perempuan', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['309', '06 November 2026', "NAELUS SAA'DAH", '22', 'Perempuan', 'Purwasari', '5', '6', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3301156611030002', 'Berobat Jalan'],
  ['310', '06 November 2026', 'SULIS SETIYAWATI', '36', 'Perempuan', 'Cilongkrang', '', '', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154707900001', 'Berobat Jalan'],
  ['311', '06 November 2026', 'NASIKEM', '46', 'Perempuan', 'Purwasari', '3', '5', 'Pasang Infus', 'BPJS', '3301155318800001', 'Rawat Inap'],
  ['312', '07 November 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['313', '07 November 2026', 'RASYA AJI WIGUNA', '11', 'Laki-laki', 'Cilongkrang', '3', '1', 'Pasang Infus', 'BPJS', '3301150502150003', 'Rawat Inap'],
  ['314', '07 November 2026', 'RASWATI', '38', 'Perempuan', 'Purwasari', '1', '6', 'Pasang Infus', 'Umum', '3674026606880003', 'Rawat Inap'],
  ['315', '07 November 2026', 'FIKA ISTIKOMAH', '21', 'Perempuan', 'Purwasari', '5', '4', 'Pasang Infus', 'BPJS', '3301155506050001', 'Rawat Inap'],
  ['316', '07 November 2026', 'WARYO SAWIYAN', '63', 'Laki-laki', 'Tarisi', '4', '1', 'Pasang Infus', 'BPJS', '3301151305630002', 'Rawat Inap'],
  ['317', '08 November 2026', 'ALI MUSTOFA', '15', 'Laki-laki', 'Bantar', '1', '4', 'Pasang Infus', 'BPJS', '3301151203110003', 'Rawat Inap'],
  ['318', '08 November 2026', 'HERNA SUSANTI', '38', 'Perempuan', 'Bantar', '4', '11', 'Nebulizer', 'Umum', '3301155308890001', 'Berobat Jalan'],
  ['319', '08 November 2026', 'GIBRAN ALWIJAYA', '5', 'Laki-laki', 'Bantar', '1', '12', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152004210001', 'Berobat Jalan'],
  ['320', '09 November 2026', 'DWI SUSANTI', '34', 'Perempuan', 'Bantar', '3', '1', 'Nebulizer', 'BPJS', '3301115401920002', 'Berobat Jalan'],
  ['321', '08 November 2026', 'TUNGGAL S', '13', 'Laki-laki', 'Tarisi', '3', '5', 'Pasang Infus', 'Umum', '3301150604130001', 'Rawat Inap'],
  ['322', '09 November 2026', 'PURWADI', '64', 'Laki-laki', 'Adimulya', '1', '14', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150707620003', 'Berobat Jalan'],
  ['323', '09 November 2026', 'HEGAR TRI PAROGA', '14', 'Laki-laki', 'Bantar', '1', '12', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150205120003', 'Berobat Jalan'],
  ['324', '09 November 2026', 'WARSITEM', '48', 'Perempuan', 'Cilongkrang', '2', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155008780006', 'Berobat Jalan'],
  ['325', '09 November 2026', 'HARYANTO', '50', 'Laki-laki', 'Bantar', '1', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151608760001', 'Berobat Jalan'],
  ['326', '09 November 2026', 'PAIYEM', '73', 'Perempuan', 'Tarisi', '3', '8', 'EKG', 'BPJS', '3301156908530001', 'Berobat Jalan'],
  ['327', '09 November 2026', 'DEHAN FAOZAN', '47', 'Laki-laki', 'Tarisi', '2', '7', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150503790009', 'Berobat Jalan'],
  ['328', '09 November 2026', 'SAMSUDIN', '68', 'Laki-laki', 'Adimulya', '2', '2', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151005580003', 'Berobat Jalan'],
  ['329', '09 November 2026', 'DINDA LUTFITA DEWI', '18', 'Perempuan', 'Bantar', '3', '14', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156812070001', 'Berobat Jalan'],
  ['330', '09 November 2026', 'WASTIYAH', '71', 'Perempuan', 'Bantar', '4', '11', 'Pasang Infus', 'BPJS', '3301155107540003', 'Berobat Jalan'],
  ['331', '09 November 2026', "NAELUS SAA'DAH", '22', 'Perempuan', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156611030002', 'Berobat Jalan'],
  ['332', '09 November 2026', 'SANJO', '67', 'Laki-laki', 'Tarisi', '4', '4', 'Pasang Infus', 'BPJS', '3301150802590001', 'Rawat Inap'],
  ['333', '09 November 2026', 'SARIFAH', '49', 'Perempuan', 'Bantar', '2', '11', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156011760003', 'Berobat Jalan'],
  ['334', '10 November 2026', 'GIBRAN ALWIJAYA', '5', 'Laki-laki', 'Bantar', '1', '20', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152004210001', 'Berobat Jalan'],
  ['335', '10 November 2026', 'MARSITI', '80', 'Perempuan', 'Bantar', '1', '9', 'Pasang Infus', 'BPJS', '3301154605460001', 'Rawat Inap'],
  ['336', '10 November 2026', 'SEPTIAN YOVIE SAPUTRA', '14', 'Laki-laki', 'Tarisi', '4', '9', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301152409120003', 'Berobat Jalan'],
  ['337', '10 November 2026', 'MUHAMD SYUKUR', '51', 'Laki-laki', 'Cilongkrang', '2', '2', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151202750003', 'Rujuk'],
  ['338', '10 November 2026', 'PARNITI', '67', 'Perempuan', 'Tarisi', '2', '2', 'Pasang Infus', 'BPJS', '3301154511590003', 'Rawat Inap'],
  ['', '11 November 2026', 'MISNO', '57', 'Laki-laki', 'Tarisi', '3', '1', 'Pasang Infus', 'BPJS', '3301152909690002', 'Rawat Inap'],
  ['339', '11 November 2026', 'HARYANTO', '50', 'Laki-laki', 'Bantar', '1', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151608760001', 'Berobat Jalan'],
  ['340', '11 November 2026', 'DARMAN', '65', 'Laki-laki', 'Purwasari', '2', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152108610001', 'Berobat Jalan'],
  ['341', '11 November 2026', 'DINDA LUTFITA DEWI', '18', 'Perempuan', 'Bantar', '3', '14', 'Perawatan Luka, Ganti Balut', 'Umum', '3301156812070001', 'Berobat Jalan'],
  ['342', '11 November 2026', 'SARIFAH', '49', 'Perempuan', 'Bantar', '2', '11', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301156011760003', 'Berobat Jalan'],
  ['343', '11 November 2026', 'DEVI SAFITRI', '18', 'Perempuan', 'Bantar', '3', '2', 'Pasang Infus', 'BPJS', '3207175010080001', 'Rawat Inap'],
  ['344', '11 November 2026', 'TURSIH', '58', 'Perempuan', 'Tarisi', '2', '9', 'Pasang Infus', 'BPJS', '3301155106680002', 'Rawat Inap'],
  ['345', '12 November 2026', 'MELIYA KUNTAMI', '39', 'Perempuan', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155110870004', 'Berobat Jalan'],
  ['347', '13 November 2026', 'ANTON LESMANA', '33', 'Laki-laki', 'Bantar', '2', '19', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301150312920001', 'Berobat Jalan'],
  ['348', '13 November 2026', 'WARYO SAWIYAN', '63', 'Laki-laki', 'Tarisi', '4', '1', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151305630002', 'Berobat Jalan'],
  ['349', '13 November 2026', 'TARKIM', '61', 'Laki-laki', 'Bantar', '3', '3', 'Ekstraksi Corpus Alienum (Telinga, Mata, Hidung dll)', 'BPJS', '3301150207650007', 'Berobat Jalan'],
  ['350', '13 November 2026', 'DARMAN', '65', 'Laki-laki', 'Purwasari', '2', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152108610001', 'Berobat Jalan'],
  ['351', '13 November 2026', 'SUPIYAH', '40', 'Perempuan', 'Tarisi', '1', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154101860023', 'Berobat Jalan'],
  ['352', '13 November 2026', 'HARYANTO', '50', 'Laki-laki', 'Bantar', '1', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301151608760001', 'Berobat Jalan'],
  ['353', '13 November 2026', 'YAHMAN', '71', 'Laki-laki', 'Bantar', '2', '2', 'Pasang Infus', 'BPJS', '3301150304550004', 'Rawat Inap'],
  ['354', '14 November 2026', 'MELIYA KUNTAMI', '39', 'Perempuan', 'Purwasari', '5', '6', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301155110870004', 'Berobat Jalan'],
  ['355', '14 November 2026', 'DARMAN', '65', 'Laki-laki', 'Purwasari', '2', '5', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301152108610001', 'Berobat Jalan'],
  ['356', '14 November 2026', 'SUPIYAH', '40', 'Perempuan', 'Tarisi', '1', '8', 'Perawatan Luka, Ganti Balut', 'BPJS', '3301154101860023', 'Berobat Jalan'],
  ['357', '14 November 2026', 'WAWAN GUNAWAN', '49', 'Laki-laki', 'Tarisi', '5', '8', 'Perawatan Luka, Ganti Balut', 'Umum', '3301151402770001', 'Berobat Jalan'],
  ['358', '14 November 2026', 'FATIMAH', '36', 'Perempuan', 'Purwasari', '5', '2', 'Pasang Infus', 'BPJS', '3301154404890007', 'Rawat Inap'],
  ['359', '14 November 2026', 'WAHYUDIN HIDAYAT', '63', 'Laki-laki', 'Tarisi', '3', '12', 'Pasang Infus', 'Umum', '3301152012620001', 'Rawat Inap'],
  ['360', '15 November 2026', 'daryani', '50', 'Perempuan', 'Adimulya', '3', '2', 'Pasang Infus', 'BPJS', '3301155008760001', 'Rawat Inap'],
  ['361', '15 November 2026', 'KARDIMAN', '66', 'Laki-laki', 'Tarisi', '3', '4', 'Pasang Infus', 'BPJS', '3301152709610001', 'Rawat Inap'],
  ['362', '15 November 2026', 'PARSINAH', '82', 'Perempuan', 'Bantar', '1', '2', 'Pasang Infus', 'BPJS', '3301154711440001', 'Rawat Inap'],
  ['363', '15 November 2026', 'SARIYANTO', '43', 'Laki-laki', 'Tarisi', '2', '2', 'Jahit/ Lepas Jahit Luka', 'BPJS', '3401021208850001', 'Berobat Jalan'],
  ['364', '15 November 2026', 'DELA AMELIA', '21', 'Perempuan', 'Tarisi', '1', '5', 'Pasang Infus', 'BPJS', '3301156503050002', 'Rawat Inap'],
  ['365', '15 November 2026', 'SAMINGUN', '77', 'Laki-laki', 'Bantar', '1', '1', 'Pasang Infus', 'BPJS', '3301150904490001', 'Rawat Inap'],
];

export const RAW_RANAP_ROWS: RawRanapRow[] = [
  [1, 'SAMAN', 66, 'Laki-laki', 'Cilongkrang', '2', '1', 'ISPA/ ISPA Atas - J06.9', '01 Oktober 2026', '1:30', '02 Oktober 2026', '10:30', '1', 'BPJS', '3301150309600002', 'Rujuk'],
  [2, 'SARING WARDONO', 54, 'Laki-laki', 'Cilongkrang', '2', '4', 'Envenomation Snake Bite - T63.0 + X23', '01 Oktober 2026', '9:00', '02 Oktober 2026', '10:30', '1', 'BPJS', '3301151404720005', 'BLPL'],
  [3, 'RIZKI RAMADANI', 17, 'Laki-laki', 'Purwasari', '2', '3', 'Febris/ Demam - R50', '01 Oktober 2026', '16:00', '03 Oktober 2026', '10:00', '2', 'BPJS', '3301152508090002', 'BLPL'],
  [4, 'OMOH SALAMAH', 76, 'Perempuan', 'Cilongkrang', '3', '2', 'Hipertensi Esensial - I10', '02 Oktober 2026', '2:05', '05 Oktober 2026', '11:00', '3', 'BPJS', '3301154609500003', 'BLPL'],
  [5, 'MURTINAH', 70, 'Perempuan', 'Purwasari', '5', '3', 'Febris/ Demam - R50', '02 Oktober 2026', '15:30', '05 Oktober 2026', '11:00', '3', 'Umum', '3301154304560003', 'BLPL'],
  [6, 'SAMINGUN', 77, 'Laki-laki', 'Bantar', '1', '1', 'ISPA/ ISPA Atas - J06.9', '02 Oktober 2026', '20:00', '05 Oktober 2026', '10:18', '3', 'BPJS', '3301150904490001', 'BLPL'],
  [7, 'KHOMYATI', 55, 'Perempuan', 'Bantar', '1', '2', 'Diabetes Melitus Tipe 2 - E11.9', '03 Oktober 2026', '11.35', '06 Oktober 2026', '10:30', '3', 'BPJS', '3301155207710005', 'BLPL'],
  [8, 'PARSINAH', 81, 'Perempuan', 'Bantar', '1', '2', 'Gastritis/ Dispepsia - K29.7', '03 Oktober 2026', '13.45', '06 Oktober 2026', '11.46', '3', 'BPJS', '3301154711440001', 'BLPL'],
  [9, 'USEP ROMLI', 61, 'Laki-laki', 'Tarisi', '3', '5', 'Gastritis/ Dispepsia - K29.7', '04 Oktober 2026', '10.15', '06 Oktober 2026', '10:15', '2', 'BPJS', '3301151309650002', 'BLPL'],
  [10, 'RAMINAH', 69, 'Perempuan', 'Purwasari', '1', '5', 'GEA + Dehidrasi Ringan-sedang - A09 + E86', '04 Oktober 2026', '11.45', '06 Oktober 2026', '10:30', '2', 'Umum', '3301155312560002', 'BLPL'],
  [11, 'AISYAH AZKIYA CHAYRA', 5, 'Perempuan', 'Cilongkrang', '3', '1', 'ISPA/ ISPA Atas - J06.9', '04 Oktober 2026', '18.12', '07 Oktober 2026', '9.15', '3', 'BPJS', '3301157004210001', 'BLPL'],
  [12, 'SUYATNO', 33, 'Laki-laki', 'Bantar', '2', '10', 'Gastritis/ Dispepsia - K29.7', '04 Oktober 2026', '19.45', '06 Oktober 2026', '10:30', '2', 'BPJS', '3301151608930002', 'BLPL'],
  [13, 'ASHEEQA AMANIA ZIDNI', 6, 'Perempuan', 'Tarisi', '4', '6', 'Febris/ Demam - R50', '05 Oktober 2026', '7:30', '06 Oktober 2026', '10:30', '1', 'Umum', '3301155107200003', 'BLPL'],
  [14, 'JARIYAH', 59, 'Perempuan', 'Tarisi', '3', '7', 'GEA + Diare tanpa dehidrasi - A09', '05 Oktober 2026', '14:30', '08 Oktober 2026', '10:00', '3', 'BPJS', '3301155006670003', 'BLPL'],
  [15, 'DARMONO', 32, 'Laki-laki', 'Luar Wilayah', '3', '3', 'Vertigo - R42/ H81.9', '06 Oktober 2026', '7:00', '08 Oktober 2026', '10:00', '2', 'BPJS', '3301182904940005', 'BLPL'],
  [16, 'HAYATUL HUSNA', 15, 'Perempuan', 'Cilongkrang', '4', '5', 'Febris/ Demam - R50', '05 Oktober 2026', '11.45', '07 Oktober 2026', '9.15', '2', 'BPJS', '3301156704110001', 'BLPL'],
  [17, 'WENI ANGGI ANGGRAENI', 53, 'Perempuan', 'Tarisi', '4', '1', 'GEA + Dehidrasi Ringan-sedang - A09 + E86', '06 Oktober 2026', '17:54', '09 Oktober 2026', '10:00', '3', 'BPJS', '3301156104730001', 'BLPL'],
  [18, 'DASIKUN', 51, 'Laki-laki', 'Tarisi', '5', '6', 'Vertigo - R42/ H81.9', '06 Oktober 2026', '23:30', '08 Oktober 2026', '10:00', '2', 'BPJS', '3301151701750001', 'BLPL'],
  [19, 'MUHAMMAD MIFTAKHUDIN', 12, 'Laki-laki', 'Bantar', '1', '12', 'Gastritis/ Dispepsia - K29.7', '07 Oktober 2026', '17:30', '09 Oktober 2026', '10:00', '2', 'BPJS', '3301151007140002', 'BLPL'],
  [20, 'SUKARNO', 44, 'Laki-laki', 'Cilongkrang', '1', '4', 'Gastritis/ Dispepsia - K29.7', '07 Oktober 2026', '18:00', '08 Oktober 2026', '10:00', '1', 'Umum', '3301150212810001', 'APS'],
  [21, 'DARSITO', 67, 'Laki-laki', 'Bantar', '3', '3', 'Gastritis/ Dispepsia - K29.7', '08 Oktober 2026', '6.3', '11 Oktober 2026', '11:00', '4', 'BPJS', '3301151107590003', 'BLPL'],
  [22, 'KARNO', 70, 'Laki-laki', 'Bantar', '3', '20', 'ISPA/ ISPA Atas - J06.9', '08 Oktober 2026', '9:30', '11 Oktober 2026', '11:00', '3', 'BPJS', '3301150712550001', 'BLPL'],
  [23, 'SUKARNO', 44, 'Laki-laki', 'Cilongkrang', '1', '4', 'Gastritis/ Dispepsia - K29.7', '08 Oktober 2026', '12.35', '09 Oktober 2026', '10:00', '1', 'BPJS', '3301150212810001', 'APS'],
  [24, 'KINAH', 62, 'Perempuan', 'Tarisi', '2', '9', 'ISPA/ ISPA Atas - J06.9', '08 Oktober 2026', '12.45', '12 Oktober 2026', '11:00', '4', 'BPJS', '3301156507640002', 'BLPL'],
  [25, 'WARJO', 72, 'Laki-laki', 'Cilongkrang', '3', '3', 'Febris/ Demam - R50', '08 Oktober 2026', '17:30', '12 Oktober 2026', '11:30', '4', 'BPJS', '3301150712530002', 'BLPL'],
  [26, 'HAFID KURNIAWAN', 8, 'Laki-laki', 'Luar Wilayah', '3', '1', 'ISPA/ ISPA Atas - J06.9', '08 Oktober 2026', '20:00', '11 Oktober 2026', '11:00', '3', 'BPJS', '3604242809180005', 'BLPL'],
  [27, 'MAMAH', 61, 'Perempuan', 'Tarisi', '4', '9', 'Hipertensi Esensial - I10', '08 Oktober 2026', '23:15', '12 Oktober 2026', '11:00', '4', 'BPJS', '3301155306650002', 'BLPL'],
  [28, 'MOZA CILA SAKRINI', 11, 'Perempuan', 'Cilongkrang', '3', '6', 'Gastritis/ Dispepsia - K29.7', '09 Oktober 2026', '3:00', '12 Oktober 2026', '10:30', '3', 'BPJS', '3301154501150001', 'BLPL'],
  [29, 'WAHIDATUN NURUL JANAH', 13, 'Perempuan', 'Bantar', '01', '12', 'Febris/ Demam - R50', '09 Oktober 2026', '14:00', '12 Oktober 2026', '10:30', '3', 'BPJS', '3301155804130001', 'BLPL'],
  [30, 'KENI NOVIYANTI', 17, 'Perempuan', 'Bantar', '2', '8', 'Febris/ Demam - R50', '10 Oktober 2026', '9:00', '12 Oktober 2026', '11:00', '2', 'BPJS', '3301155509090004', 'BLPL'],
  [31, 'RASMAH', 67, 'Perempuan', 'Tarisi', '2', '1', 'Febris/ Demam - R50', '11 Oktober 2026', '13:10', '14 Oktober 2026', '11:30', '4', 'BPJS', '3301154407590004', 'BLPL'],
  [32, 'DESTA YANUAR ROHANI', 16, 'Laki-laki', 'Cilongkrang', '1', '5', 'Febris/ Demam - R50', '11 Oktober 2026', '15:30', '13 Oktober 2026', '10:30', '2', 'Umum', '3301152712100005', 'BLPL'],
  [33, 'NENENG NURJANAH', 42, 'Perempuan', 'Bantar', '3', '3', 'Hypertensive Heart Disease / HHD - I11', '09 Oktober 2026', '16:00', '13 Oktober 2026', '10:30', '4', 'BPJS', '3205194609830005', 'BLPL'],
  [34, 'RIRIN SYIFA', 19, 'Perempuan', 'Bantar', '1', '15', 'TBC - A15', '12 Oktober 2026', '16:30', '13 Oktober 2026', '12:00', '1', 'BPJS', '3301156905070001', 'BLPL'],
  [35, 'PARNO', 71, 'Laki-laki', 'Tarisi', '1', '4', 'ISPA/ ISPA Atas - J06.9', '12 Oktober 2026', '19:00', '15 Oktober 2026', '10:00', '3', 'BPJS', '3301152005550002', 'BLPL'],
  [36, 'PARTIMAH', 66, 'Perempuan', 'Purwasari', '2', '6', 'Gastritis/ Dispepsia - K29.7', '13 Oktober 2026', '8:00', '15 Oktober 2026', '10:00', '2', 'Umum', '3301154301600004', 'BLPL'],
  [37, 'SURONO WIJAYANTO', 30, 'Laki-laki', 'Bantar', '2', '6', 'Gastritis/ Dispepsia - K29.7', '13 Oktober 2026', '8:00', '15 Oktober 2026', '10:30', '2', 'BPJS', '3301151905960003', 'BLPL'],
  [38, 'ATIKAH HUJAIMAH', 21, 'Perempuan', 'Tarisi', '3', '6', 'Gastritis/ Dispepsia - K29.7', '13 Oktober 2026', '9:30', '16 Oktober 2026', '10:00', '3', 'BPJS', '3301155101050004', 'BLPL'],
  [39, 'MARTO', 67, 'Laki-laki', 'Bantar', '3', '15', 'GEA + Diare tanpa dehidrasi - A09', '13 Oktober 2026', '12:00', '14 Oktober 2026', '12:00', '1', 'Umum', '3301152711580001', 'BLPL'],
  [40, 'RAFKA SHAQUILLE ZHAFRAN', 9, 'Laki-laki', 'Tarisi', '4', '4', 'Febris/ Demam - R50', '13 Oktober 2026', '16:30', '16 Oktober 2026', '9:00', '3', 'BPJS', '3301151703170002', 'BLPL'],
  [41, 'WATINI', 60, 'Perempuan', 'Adimulya', '02', '16', 'Gastritis/ Dispepsia - K29.7', '14 Oktober 2026', '4:30', '16 Oktober 2026', '9:00', '2', 'BPJS', '3301156011650003', 'BLPL'],
  [42, 'FAREL RAFANSYAH', 1, 'Laki-laki', 'Bantar', '1', '12', 'ISPA/ ISPA Atas - J06.9', '14 Oktober 2026', '9:30', '16 Oktober 2026', '9:50', '2', 'BPJS', '3301152811250002', 'BLPL'],
  [43, 'SUTOPO', 36, 'Laki-laki', 'Cilongkrang', '3', '1', 'Gastritis/ Dispepsia - K29.7', '14 Oktober 2026', '14:30', '16 Oktober 2026', '11:00', '2', 'BPJS', '3301152806900002', 'BLPL'],
  [44, 'SAKIYEM', 60, 'Perempuan', 'Tarisi', '3', '7', 'Vertigo - R42/ H81.9', '14 Oktober 2026', '10:00', '17 Oktober 2026', '9:30', '3', 'BPJS', '3301154209660004', 'BLPL'],
  [45, 'CHINDYA NUR ALFIANI', 8, 'Perempuan', 'Bantar', '2', '3', 'Febris/ Demam - R50', '14 Oktober 2026', '16:15', '17 Oktober 2026', '9:30', '3', 'BPJS', '3301155609180002', 'BLPL'],
  [46, 'AAN ARIYANTO', 47, 'Laki-laki', 'Purwasari', '1', '5', 'Orchitis (Peradangan testis yang terisolasi) - N45.2', '15 Oktober 2026', '10:45', '16 Oktober 2026', '15:30', '1', 'BPJS', '3301152404790004', 'Rujuk'],
  [47, 'MUHAMAD FAJAR GUMELAR', 34, 'Laki-laki', 'Tarisi', '3', '2', 'Cephalgia/ Sakit Kepala - R51', '15 Oktober 2026', '13:00', '16 Oktober 2026', '10:00', '1', 'BPJS', '3301152906920001', 'Rujuk'],
  [48, 'TARSONO', 37, 'Laki-laki', 'Luar Wilayah', '2', '4', 'Gastritis/ Dispepsia - K29.7', '16 Oktober 2026', '12:00', '17 Oktober 2026', '9:30', '1', 'BPJS', '3301181003890004', 'BLPL'],
  [49, 'SITI ROBINGAH', 60, 'Perempuan', 'Cilongkrang', '4', '7', 'Gastritis/ Dispepsia - K29.7', '17 Oktober 2026', '17.45', '20 Oktober 2026', '9:30', '3', 'BPJS', '3301154401660001', 'BLPL'],
  [50, 'SUDIONO', 50, 'Laki-laki', 'Cilongkrang', '3', '2', 'Gastritis/ Dispepsia - K29.7', '18 Oktober 2026', '6:30', '19 Oktober 2026', '11:00', '1', 'Umum', '3301150311750003', 'BLPL'],
  [51, 'DARMIN AL MUHNI', 75, 'Laki-laki', 'Bantar', '1', '12', 'ISPA/ ISPA Atas - J06.9', '18 Oktober 2026', '14:30', '21 Oktober 2026', '10:00', '3', 'BPJS', '3301150202510002', 'BLPL'],
  [52, 'RATIM MURJI', 56, 'Laki-laki', 'Tarisi', '5', '9', 'Chest Pain - R07.4', '18 Oktober 2026', '21.35', '19 Oktober 2026', '10:00', '1', 'BPJS', '3301150507700007', 'Rujuk'],
  [53, 'WAGIRUN', 64, 'Laki-laki', 'Cilongkrang', '3', '7', 'GEA + Diare tanpa dehidrasi - A09', '18 Oktober 2026', '15:30', '21 Oktober 2026', '10:00', '3', 'BPJS', '3301150702620003', 'BLPL'],
  [54, 'SYEHUDIN', 42, 'Laki-laki', 'Cilongkrang', '3', '7', 'GEA + Diare tanpa dehidrasi - A09', '18 Oktober 2026', '15:30', '21 Oktober 2026', '10:00', '3', 'BPJS', '3301182208840005', 'BLPL'],
  [55, 'SUMIATIN', 70, 'Perempuan', 'Tarisi', '3', '1', 'Gastritis/ Dispepsia - K29.7', '19 Oktober 2026', '5:00', '21 Oktober 2026', '10:00', '2', 'BPJS', '3301154507560004', 'BLPL'],
  [56, 'NASLIM', 72, 'Laki-laki', 'Purwasari', '5', '4', 'ISPA/ ISPA Atas - J06.9', '19 Oktober 2026', '12:00', '21 Oktober 2026', '10:00', '2', 'BPJS', '3301151206540001', 'BLPL'],
  [57, 'ASIYAH', 54, 'Perempuan', 'Cilongkrang', '2', '7', 'Gastritis/ Dispepsia - K29.7', '19 Oktober 2026', '17:00', '22 Oktober 2026', '10:00', '3', 'BPJS', '3301156001720003', 'BLPL'],
  [58, 'MIRA WAHYUDIN', 66, 'Laki-laki', 'Tarisi', '3', '6', 'Demam Tifoid - A01.0', '21 Oktober 2026', '0:30', '23 Oktober 2026', '10:00', '2', 'BPJS', '3301151400600001', 'BLPL'],
  [59, 'MANISAH', 57, 'Perempuan', 'Tarisi', '3', '2', 'Vertigo - R42/ H81.9', '21 Oktober 2026', '6:00', '23 Oktober 2026', '10:00', '2', 'BPJS', '3301154101690007', 'BLPL'],
  [60, 'PONIJAN', 68, 'Laki-laki', 'Luar Wilayah', '3', '6', 'Gastritis/ Dispepsia - K29.7', '21 Oktober 2026', '8:00', '23 Oktober 2026', '10:00', '2', 'BPJS', '3301101505580001', 'BLPL'],
  [61, 'ADE MARLIAH', 26, 'Perempuan', 'Bantar', '1', '17', 'Gastritis/ Dispepsia - K29.7', '22 Oktober 2026', '7:00', '23 Oktober 2026', '10:00', '1', 'Umum', '3301155503000003', 'BLPL'],
  [62, 'MANISEM', 70, 'Perempuan', 'Tarisi', '4', '8', 'Quadriplegia/ Tetraparesis - G82.50', '22 Oktober 2026', '11:00', '22 Oktober 2026', '20:30', '0', 'BPJS', '3301154205560006', 'Rujuk'],
  [63, 'MARKIM', 66, 'Laki-laki', 'Bantar', '3', '3', 'Febris/ Demam - R50', '22 Oktober 2026', '15:30', '25 Oktober 2026', '09:00', '3', 'BPJS', '3301150203600004', 'BLPL'],
  [64, 'DASMI', 50, 'Perempuan', 'Bantar', '2', '2', 'Stroke, not specified - I64', '22 Oktober 2026', '16:00', '25 Oktober 2026', '18:00', '3', 'Umum', '3276104302760004', 'APS'],
  [65, 'SRY RUSMIYATIN RAHAYU', 14, 'Perempuan', 'Tarisi', '2', '4', 'GEA + Diare tanpa dehidrasi - A09', '22 Oktober 2026', '19:19', '25 Oktober 2026', '09:00', '3', 'BPJS', '3301156410110001', 'BLPL'],
  [66, 'DULHASIM ASIM', 75, 'Laki-laki', 'Tarisi', '1', '7', 'ISPA/ ISPA Atas - J06.9', '23 Oktober 2026', '08.00', '26 Oktober 2026', '10:00', '3', 'BPJS', '3301150101510042', 'BLPL'],
  [67, 'BISMA BHUMI N', 9, 'Laki-laki', 'Purwasari', '3', '4', 'Febris/ Demam - R50', '23 Oktober 2026', '10.00', '26 Oktober 2026', '10:00', '3', 'BPJS', '3301151001260001', 'BLPL'],
  [68, 'RADIT ADITIA P', 13, 'Laki-laki', 'Bantar', '4', '14', 'Febris/ Demam - R50', '23 Oktober 2026', '18:30', '28 Oktober 2026', '10.35', '5', 'BPJS', '3301152603130001', 'BLPL'],
  [69, 'RUKAMAH', 71, 'Perempuan', 'Bantar', '1', '4', 'Gastritis/ Dispepsia - K29.7', '24 Oktober 2026', '5:30', '24 Oktober 2026', '22', '0', 'BPJS', '3301150110550003', 'Rujuk'],
  [70, 'SUTRISNO', 75, 'Laki-laki', 'Bantar', '2', '19', 'Vertigo - R42/ H81.9', '24 Oktober 2026', '18:00', '29 Oktober 2026', '9:30', '5', 'BPJS', '3301151508510002', 'BLPL'],
  [71, 'SAEPUDIN', 57, 'Laki-laki', 'Cilongkrang', '4', '7', 'Vertigo - R42/ H81.9', '25 Oktober 2026', '06:30', '25 Oktober 2026', '18:30', '0', 'Umum', '3207350304690001', 'Rujuk'],
  [72, 'MISMAN', 61, 'Laki-laki', 'Sidamulya', '3', '7', 'Gastritis/ Dispepsia - K29.7', '25 Oktober 2026', '10:15', '29 Oktober 2026', '9:00', '4', 'BPJS', '3301150511640001', 'BLPL'],
  [73, 'YATIRAH', 66, 'Perempuan', 'Cilongkrang', '4', '4', 'Gastritis/ Dispepsia - K29.7', '25 Oktober 2026', '10:15', '26 Oktober 2026', '10:00', '1', 'BPJS', '3301156403600001', 'BLPL'],
  [74, 'ROBINI', 74, 'Perempuan', 'Tarisi', '3', '6', 'Hypertensive Heart Disease / HHD - I11', '25 Oktober 2026', '15.35', '26 Oktober 2026', '19:00', '1', 'BPJS', '3301155311510001', 'Rujuk'],
  [75, 'AHMAD ISMAIL', 39, 'Laki-laki', 'Bantar', '3', '5', 'GEA + Diare tanpa dehidrasi - A09', '25 Oktober 2026', '19:00', '28 Oktober 2026', '10.35', '3', 'BPJS', '3301150706870002', 'BLPL'],
  [76, 'EKO PRIYANTO', 31, 'Laki-laki', 'Purwasari', '6', '4', 'ISPA/ ISPA Atas - J06.9', '26 Oktober 2026', '13:44', '29 Oktober 2026', '9:30', '3', 'BPJS', '3301151004950005', 'BLPL'],
  [77, 'SUHERSIH', 67, 'Perempuan', 'Bantar', '2', '14', 'TBC - A15', '27 Oktober 2026', '0:15', '28 Oktober 2026', '10.35', '1', 'BPJS', '1611064503590002', 'BLPL'],
  [78, 'SALIYEM', 71, 'Perempuan', 'Purwasari', '3', '2', 'Gastritis/ Dispepsia - K29.7', '27 Oktober 2026', '9:26', '28 Oktober 2026', '21:00', '1', 'BPJS', '3301154107550003', 'Rujuk'],
  [79, 'MELINDA DWI', 23, 'Perempuan', 'Purwasari', '2', '2', 'ISPA/ ISPA Atas - J06.9', '27 Oktober 2026', '10:30', '30 Oktober 2026', '9:00', '3', 'BPJS', '3301156105030002', 'BLPL'],
  [80, 'PARIAH', 61, 'Perempuan', 'Tarisi', '3', '7', 'Vertigo - R42/ H81.9', '28 Oktober 2026', '0.25', '30 Oktober 2026', '9:00', '2', 'BPJS', '3301024307650008', 'BLPL'],
  [81, 'CARTINI', 60, 'Perempuan', 'Bantar', '1', '2', 'Asma Bronkial - J45.9', '28 Oktober 2026', '7.45', '30 Oktober 2026', '10:30', '2', 'Umum', '3301154409660002', 'BLPL'],
  [82, 'RUSMINI', 48, 'Perempuan', 'Tarisi', '2', '8', 'Febris/ Demam - R50', '28 Oktober 2026', '12.35', '01 November 2026', '9:00', '4', 'BPJS', '3301157004780001', 'BLPL'],
  [83, 'KHOTOBUL MUKSIN', 29, 'Laki-laki', 'Luar Wilayah', '2', '2', 'ISPA/ ISPA Atas - J06.9', '30 Oktober 2026', '15:30', '03 November 2026', '10:00', '4', 'BPJS', '3301103108970007', 'BLPL'],
  [84, 'BARRA ALFARISQI', 3, 'Laki-laki', 'Tarisi', '3', '6', 'Febris/ Demam - R50', '31 Oktober 2026', '15:30', '02 November 2026', '10:00', '2', 'Umum', '3301151211220002', 'BLPL'],
  [85, 'KHUMARIYAH', 66, 'Perempuan', 'Cilongkrang', '3', '1', 'ISPA/ ISPA Atas - J06.9', '31 Oktober 2026', '18:00', '04 November 2026', '10:00', '4', 'Umum', '3301154604600001', 'BLPL'],
  [86, 'WASITO', 59, 'Laki-laki', 'Adimulya', '1', '9', 'Febris/ Demam - R50', '01 November 2026', '21:00', '03 November 2026', '', '2', 'BPJS', '3301151207670005', 'BLPL'],
  [87, 'JAMAL ARIFIN', 70, 'Laki-laki', 'Cilongkrang', '2', '7', 'ISPA/ ISPA Atas - J06.9', '03 November 2026', '12:00', '06 November 2026', '9.45', '3', 'BPJS', '3301150805560002', 'BLPL'],
  [88, 'SAMINAH', 61, 'Perempuan', 'Tarisi', '4', '3', 'ISPA/ ISPA Atas - J06.9', '03 November 2026', '16:15', '07 November 2026', '10:30', '4', 'BPJS', '3301154907650006', 'BLPL'],
  [89, 'WASILAH', 48, 'Perempuan', 'Tarisi', '2', '7', 'GEA + Dehidrasi Ringan-sedang - A09 + E86', '03 November 2026', '20:14', '07 November 2026', '10:30', '4', 'BPJS', '3301154407780004', 'BLPL'],
  [90, 'HENI PURWATI', 63, 'Perempuan', 'Cilongkrang', '2', '7', 'Gastritis/ Dispepsia - K29.7', '03 November 2026', '22.45', '06 November 2026', '10.15', '3', 'BPJS', '3301156007630002', 'BLPL'],
  [91, 'NARJO', 71, 'Laki-laki', 'Tarisi', '4', '3', 'Gastritis/ Dispepsia - K29.7', '04 November 2026', '16.55', '06 November 2026', '10.25', '2', 'BPJS', '3301152509550001', 'BLPL'],
  [92, 'KARTINI', 51, 'Perempuan', 'Bantar', '3', '15', 'Gastritis/ Dispepsia - K29.7', '04 November 2026', '11.30', '07 November 2026', '10:00', '3', 'BPJS', '3301155206750004', 'BLPL'],
  [93, 'NIZAM', 8, 'Laki-laki', 'Cilongkrang', '3', '1', 'ISPA/ ISPA Atas - J06.9', '02 November 2026', '13:40', '04 November 2026', '10:00', '2', 'Umum', '', 'BLPL'],
  [94, 'JUMINAH', 48, 'Perempuan', 'Bantar', '2', '7', 'Hypertensive Heart Disease / HHD - I11', '05 November 2026', '6:30', '07 November 2026', '10.15', '2', 'BPJS', '3301154308780001', 'BLPL'],
  [95, 'NENENG NURJANAH', 42, 'Perempuan', 'Bantar', '3', '13', 'Chest Pain - R07.4', '05 November 2026', '14.3', '06 November 2026', '14:15', '1', 'BPJS', '3205194603830005', 'Rujuk'],
  [96, 'NASIKEM', 46, 'Perempuan', 'Purwasari', '3', '5', 'Gastritis/ Dispepsia - K29.7', '06 November 2026', '10.25', '09 November 2026', '10:00', '3', 'BPJS', '3301155318800001', 'BLPL'],
  [97, 'RASYA AJI WIGUNA', 11, 'Laki-laki', 'Cilongkrang', '3', '1', 'ISPA/ ISPA Atas - J06.9', '07 November 2026', '07:00', '10 November 2026', '10:00', '3', 'BPJS', '3301150502150003', 'BLPL'],
  [98, 'RASWATI', 38, 'Perempuan', 'Purwasari', '1', '6', 'Febris/ Demam - R50', '07 November 2026', '10:45', '09 November 2026', '10:00', '2', 'Umum', '3674026606880003', 'BLPL'],
  [99, 'FIKA ISTIKOMAH', 21, 'Perempuan', 'Purwasari', '5', '4', 'Febris/ Demam - R50', '07 November 2026', '19:00', '11 November 2026', '10:00', '4', 'BPJS', '3301155506050001', 'BLPL'],
  [100, 'WARYO SAWIYAN', 63, 'Laki-laki', 'Tarisi', '4', '1', 'Vertigo - R42/ H81.9', '07 November 2026', '22:00', '10 November 2026', '10:00', '3', 'BPJS', '3301151305630002', 'BLPL'],
  [101, 'ALI MUSTOFA', 15, 'Laki-laki', 'Bantar', '1', '4', 'Gastritis/ Dispepsia - K29.7', '08 November 2026', '1:30', '10 November 2026', '10:00', '2', 'BPJS', '3301151203110003', 'BLPL'],
  [102, 'SITI ROBINGAH', 60, 'Perempuan', 'Cilongkrang', '4', '7', 'Gastritis/ Dispepsia - K29.7', '05 November 2026', '20:00', '09 November 2026', '10:00', '4', 'BPJS', '3301154401660001', 'BLPL'],
  [103, 'TUNGGAL SAPUTRA', 13, 'Laki-laki', 'Tarisi', '3', '5', 'Envenomation Snake Bite - T63.0 + X23', '08 November 2026', '22:00', '10 November 2026', '10:00', '2', 'BPJS', '3301150604130001', 'BLPL'],
  [104, 'SANJO', 67, 'Laki-laki', 'Tarisi', '4', '4', 'Melena - K92.1', '09 November 2026', '19:15', '09 November 2026', '21.4', '0', 'BPJS', '3301150802590001', 'Rujuk'],
  [105, 'MARSITI', 80, 'Perempuan', 'Bantar', '1', '9', 'Vertigo - R42/ H81.9', '10 November 2026', '10:00', '13 November 2026', '10.35', '3', 'BPJS', '3301154605460001', 'BLPL'],
  [106, 'PARNITI', 67, 'Perempuan', 'Tarisi', '2', '2', 'Hypertensive Heart Disease / HHD - I11', '10 November 2026', '16:00', '10 November 2026', '23:00', '0', 'BPJS', '3301154511590003', 'Rujuk'],
  [107, 'MISNO', 57, 'Laki-laki', 'Tarisi', '3', '1', 'Other disorders of urinary system - N39', '11 November 2026', '10.35', '13 November 2026', '10.35', '2', 'BPJS', '3301152909690002', 'BLPL'],
  [108, 'DEVI SAFITRI', 18, 'Perempuan', 'Bantar', '3', '2', 'Gastritis/ Dispepsia - K29.7', '11 November 2026', '12.05', '13 November 2026', '10.35', '2', 'BPJS', '3207175010080001', 'BLPL'],
  [109, 'TURSIH', 58, 'Perempuan', 'Tarisi', '2', '9', 'Vertigo - R42/ H81.9', '11 November 2026', '17.35', '15 November 2026', '9.25', '4', 'BPJS', '3301155106680002', 'BLPL'],
  [110, 'yahman', 71, 'Laki-laki', 'Bantar', '2', '2', 'ISPA/ ISPA Atas - J06.9', '13 November 2026', '11.05', '15 November 2026', '9.15', '2', 'BPJS', '3301150304550004', 'BLPL'],
  [111, 'FATIMAH', 36, 'Perempuan', 'Purwasari', '5', '2', 'Gastritis/ Dispepsia - K29.7', '14 November 2026', '10', '', '', '', 'BPJS', '3301154404890007', ''],
  [112, 'wahyudin hidayat', 63, 'Laki-laki', 'Tarisi', '3', '12', 'Melena - K92.1', '14 November 2026', '21.35', '', '', '', 'Umum', '3301152012620001', ''],
  [113, 'daryani', 50, 'Perempuan', 'Adimulya', '3', '2', 'Gastritis/ Dispepsia - K29.7', '15 November 2026', '2.55', '', '', '', 'BPJS', '3301155008760001', ''],
  [114, 'KARDIMAN', 66, 'Laki-laki', 'Tarisi', '3', '4', '', '15 November 2026', '12:30', '', '', '', 'BPJS', '3301152709610001', ''],
  [115, 'PARSINAH', 82, 'Perempuan', 'Bantar', '1', '2', '', '15 November 2026', '13:00', '', '', '', 'BPJS', '3301154711440001', ''],
  [116, 'DELA AMELIA', 21, 'Perempuan', 'Tarisi', '1', '5', 'Febris/ Demam - R50', '15 November 2026', '17:00', '', '', '', 'BPJS', '3301156503050002', ''],
  [117, 'SAMINGUN', 77, 'Laki-laki', 'Bantar', '1', '1', 'ISPA/ ISPA Atas - J06.9', '15 November 2026', '19:30', '', '', '', 'BPJS', '3301150904490001', ''],
];

export function buildInitialPatientRecords(): PatientRecord[] {
  // Build lookup of Ranap rows by `${normalizedName}|${isoMasukDate}`
  const ranapByKey = new Map<string, RawRanapRow>();
  for (const rRow of RAW_RANAP_ROWS) {
    const key = `${normalizeNameKey(rRow[1])}|${parseIndoDate(rRow[8])}`;
    ranapByKey.set(key, rRow);
  }

  const matchedRanapNums = new Set<number>();
  const records: PatientRecord[] = [];

  // Map every IGD row (367 rows)
  RAW_IGD_ROWS.forEach((row, idx) => {
    const [, tglStr, nama, umurStr, jkStr, desa, rt, rw, tindakanRaw, bayarRaw, nik, statusRaw] = row;
    const tanggalMasuk = parseIndoDate(tglStr);
    const statusKeluar = mapStatusKeluar(statusRaw);
    const tindakan = normalizeTindakan(tindakanRaw);
    const hasMonths = umurStr.toUpperCase().includes('BLN');
    const umur = hasMonths ? 0 : parseInt(umurStr, 10) || 0;
    const jenisKelamin: 'L' | 'P' = jkStr.trim().toLowerCase().startsWith('l') ? 'L' : 'P';
    const kategoriPembayaran: KategoriPembayaran =
      bayarRaw.trim().toLowerCase() === 'umum' ? 'Umum' : 'BPJS';

    const base: PatientRecord = {
      id: `igd-${idx + 1}`,
      no: idx + 1,
      tanggalMasuk,
      nik: nik.trim(),
      noRm: '',
      statusKeluar,
      namaPasien: nama.trim(),
      umur,
      ...(hasMonths ? { umurLabel: umurStr.trim().toUpperCase() } : {}),
      jenisKelamin,
      alamat: {
        desa: desa.trim(),
        rt: rt.trim(),
        rw: rw.trim(),
      },
      tindakanMedisUmum: tindakan,
      kategoriPembayaran,
      triage: inferTriage(statusKeluar, tindakan),
    };

    if (statusKeluar === 'Rawat Inap Puskesmas') {
      const key = `${normalizeNameKey(nama)}|${tanggalMasuk}`;
      const match = ranapByKey.get(key);
      if (match && !matchedRanapNums.has(Number(match[0]))) {
        matchedRanapNums.add(Number(match[0]));
        const [
          ,
          ,
          ,
          ,
          ,
          ,
          ,
          diagnosa,
          ,
          masukJam,
          keluarTgl,
          keluarJam,
          jmlHariStr,
          ,
          ,
          statusPulangStr,
        ] = match;
        const parsedKeluar = keluarTgl ? parseIndoDate(keluarTgl) : undefined;
        const parsedManualDays = jmlHariStr.trim() !== '' ? parseInt(jmlHariStr, 10) : undefined;
        base.jamMasuk = normalizeTime(masukJam);
        if (diagnosa.trim()) {
          base.diagnosa = diagnosa.trim();
        }
        if (parsedKeluar) {
          base.tanggalKeluar = parsedKeluar;
        }
        const normKeluarJam = normalizeTime(keluarJam);
        if (normKeluarJam) {
          base.jamKeluar = normKeluarJam;
        }
        if (typeof parsedManualDays === 'number' && !Number.isNaN(parsedManualDays)) {
          base.jumlahHariRawatManual = parsedManualDays;
        }
        base.statusPulangRanap = mapStatusPulang(statusPulangStr);
      } else {
        // IGD Rawat Inap row not in Rawat Inap register sheet (22 Sep rows, SUYONO Nov 2, HAYATUL HUSNA Oct 6)
        base.excludeFromRanap = true;
      }
    }

    records.push(base);
  });

  // Insert unmatched Ranap-only rows (excludeFromIgd: true) at chronological position
  const ranapOnlyRecords: PatientRecord[] = [];
  for (const rRow of RAW_RANAP_ROWS) {
    const noRanap = Number(rRow[0]);
    if (matchedRanapNums.has(noRanap)) continue;
    const [
      ,
      nama,
      umur,
      jkStr,
      desa,
      rt,
      rw,
      diagnosa,
      masukTgl,
      masukJam,
      keluarTgl,
      keluarJam,
      jmlHariStr,
      bayarRaw,
      nik,
      statusPulangStr,
    ] = rRow;

    const tanggalMasuk = parseIndoDate(masukTgl);
    const parsedKeluar = keluarTgl ? parseIndoDate(keluarTgl) : undefined;
    const parsedManualDays = jmlHariStr.trim() !== '' ? parseInt(jmlHariStr, 10) : undefined;

    ranapOnlyRecords.push({
      id: `ranap-${noRanap}`,
      no: noRanap,
      tanggalMasuk,
      jamMasuk: normalizeTime(masukJam),
      nik: nik.trim(),
      noRm: '',
      statusKeluar: 'Rawat Inap Puskesmas',
      namaPasien: nama.trim(),
      umur,
      jenisKelamin: jkStr.trim().toLowerCase().startsWith('l') ? 'L' : 'P',
      alamat: {
        desa: desa.trim(),
        rt: rt.trim(),
        rw: rw.trim(),
      },
      ...(diagnosa.trim() ? { diagnosa: diagnosa.trim() } : {}),
      tindakanMedisUmum: 'Pasang Infus',
      kategoriPembayaran: bayarRaw.trim().toLowerCase() === 'umum' ? 'Umum' : 'BPJS',
      ...(parsedKeluar ? { tanggalKeluar: parsedKeluar } : {}),
      ...(normalizeTime(keluarJam) ? { jamKeluar: normalizeTime(keluarJam) } : {}),
      ...(typeof parsedManualDays === 'number' && !Number.isNaN(parsedManualDays)
        ? { jumlahHariRawatManual: parsedManualDays }
        : {}),
      statusPulangRanap: mapStatusPulang(statusPulangStr),
      triage: 'P2',
      excludeFromIgd: true,
    });
  }

  // Merge Ranap-only records right after the last record with tanggalMasuk <= r.tanggalMasuk
  for (const rOnly of ranapOnlyRecords) {
    let insertAt = records.length;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].tanggalMasuk <= rOnly.tanggalMasuk) {
        insertAt = i + 1;
        break;
      }
    }
    records.splice(insertAt, 0, rOnly);
  }

  return records;
}
