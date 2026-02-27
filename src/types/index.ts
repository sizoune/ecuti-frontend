// ============ Auth ============

export interface LoginRequest {
  pegawai_nip: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: AuthUser
}

export interface AuthUser {
  pegawai_id: number
  pegawai_nip: string
  pegawai_nama: string
  pegawai_type: string
  pegawai_kedudukanpns: string
  role: UserRole
  role_level: number
  skpd_id: number
  subunit_id: number
}

export type UserRole = 'Super Admin' | 'Admin SKPD' | 'Admin Uker' | 'Pegawai'

// ============ Pegawai ============

export interface Pegawai {
  pegawai_id: number
  pegawai_nip: string
  pegawai_nama: string
  pegawai_gelardepan: string | null
  pegawai_gelarbelakang: string | null
  pegawai_type?: string
  pegawai_kedudukanpns: string
  pegawai_email: string | null
  pegawai_nohp: string | null
  skpd_id: number
  subunit_id: number
  skpd_nama?: string
  subunit_nama?: string
  golongan_nama?: string
  jabatan_nama?: string
  eselon_nama?: string
}

export interface UpdateProfileRequest {
  pegawai_email?: string
  pegawai_nohp?: string
}

// ============ Cuti ============

export type CutiStatus = 'Verifikasi' | 'Batal' | 'Ditolak' | 'Proses' | 'Terima' | 'BTL'

export interface Cuti {
  usulcuti_id: number
  pegawai_id: number
  jeniscuti_id: number
  usulcuti_tglawal: string
  usulcuti_tglakhir: string
  usulcuti_jumlah: number
  usulcuti_alasan: string
  usulcuti_alamat: string | null
  usulcuti_lokasi: string | null
  usulcuti_status: CutiStatus
  atasanlangsung_id: number | null
  atasanlangsung_status: string | null
  pejabat_id: number | null
  pejabat_status: string | null
  skpd_id: number
  subunit_id: number
  created_at: string
  updated_at: string
  // Joined fields
  pegawai_nama?: string
  pegawai_nip?: string
  pegawai_gelardepan?: string | null
  pegawai_gelarbelakang?: string | null
  jeniscuti_nama?: string
  skpd_nama?: string
  subunit_nama?: string
  jabatan_nama?: string
  eselon_nama?: string
  atasanlangsung_nama?: string
  pejabat_nama?: string
}

export interface CreateCutiRequest {
  jeniscuti_id: number
  usulcuti_tglawal: string
  usulcuti_tglakhir: string
  usulcuti_jumlah: number
  usulcuti_alasan: string
  usulcuti_alamat: string
  usulcuti_lokasi: 'Dalam Negeri' | 'Luar Negeri'
  atasanlangsung_id: number
  pejabat_id: number
}

export interface UpdateCutiStatusRequest {
  usulcuti_status?: CutiStatus
  atasanlangsung_status?: string
  pejabat_status?: string
}

export interface CutiBalance {
  jeniscuti_id: number
  jeniscuti_nama: string
  sisa: number
  terpakai: number
  total: number
}

export interface CutiStatistics {
  total_pengajuan: number
  total_disetujui: number
  total_ditolak: number
  total_proses: number
  total_batal: number
  by_jenis?: Array<{
    jeniscuti_id: number
    jeniscuti_nama: string
    total: number
  }>
}

// ============ Master Data ============

export interface Skpd {
  skpd_id: number
  skpd_nama: string
  skpd_singkatan?: string
}

export interface Subunit {
  subunit_id: number
  subunit_nama: string
  skpd_id: number
}

export interface JenisCuti {
  jeniscuti_id: number
  jeniscuti_nama: string
}

export interface Golongan {
  golongan_id: number
  golongan_nama: string
}

export interface Jabatan {
  jabatan_id: number
  jabatan_nama: string
}

export interface Eselon {
  eselon_id: number
  eselon_nama: string
}

// ============ API Response ============

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface CutiFilters {
  page?: number
  limit?: number
  pegawai_id?: number
  skpd_id?: number
  subunit_id?: number
  status?: CutiStatus
  jeniscuti_id?: number
  tahun?: number
}

export interface PegawaiFilters {
  page?: number
  limit?: number
  skpd_id?: number
  subunit_id?: number
  search?: string
}

// ============ Laporan ============

export interface LaporanDashboardItem {
  jeniscuti_id: number
  jeniscuti_nama: string
  verifikasi: number
  btl: number
  ditolak: number
  batal: number
  proses: number
  terima: number
  total: number
}

export interface LaporanUsulanItem {
  usulcuti_id: number
  usulcuti_tgl: string
  usulcuti_tglawal: string
  usulcuti_tglakhir: string
  usulcuti_jumlah: number
  usulcuti_alasan: string
  usulcuti_status: CutiStatus
  usulcuti_masakerja: string | null
  usulcuti_tembusan: string | null
  pegawai_id: number
  pegawai_nip: string
  pegawai_nama: string
  pegawai_gelardepan: string | null
  pegawai_gelarbelakang: string | null
  jabatan_nama: string
  subunit_nama: string
  skpd_nama: string
  eselon_nama: string | null
  jeniscuti_nama: string
}

export interface LaporanRekapItem {
  jeniscuti_id: number
  jeniscuti_nama: string
  jan: number
  feb: number
  mar: number
  apr: number
  mei: number
  jun: number
  jul: number
  ags: number
  sep: number
  okt: number
  nov: number
  des: number
  total: number
}

export interface BukuCutiItem {
  bukucuti_id: number
  pegawai_id: number
  jeniscuti_id: number
  bukucuti_tahun: number
  bukucuti_status: string
  jeniscuti_nama: string
  jeniscuti_kode: string
  pegawai_nama: string
  pegawai_nip: string
  [key: string]: unknown
}
