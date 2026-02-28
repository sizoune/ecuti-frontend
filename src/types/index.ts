// ============ Auth ============

export interface LoginRequest {
	pegawai_nip: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	user: AuthUser;
}

export interface AuthUser {
	pegawai_id: number;
	pegawai_nip: string;
	pegawai_nama: string;
	pegawai_type: string;
	pegawai_kedudukanpns: string;
	role: UserRole;
	role_level: number;
	skpd_id: number;
	subunit_id: number;
}

export type UserRole = "Super Admin" | "Admin SKPD" | "Admin Uker" | "Pegawai";

// ============ Pegawai ============

export interface Pegawai {
	pegawai_id: number;
	pegawai_nip: string;
	pegawai_nama: string;
	pegawai_gelardepan: string | null;
	pegawai_gelarbelakang: string | null;
	pegawai_type?: string;
	pegawai_kedudukanpns: string;
	pegawai_email: string | null;
	pegawai_nohp: string | null;
	skpd_id: number;
	subunit_id: number;
	skpd_nama?: string;
	subunit_nama?: string;
	golongan_nama?: string;
	jabatan_nama?: string;
	eselon_nama?: string;
}

export interface UpdateProfileRequest {
	pegawai_email?: string;
	pegawai_nohp?: string;
}

// ============ Cuti ============

export type CutiStatus =
	| "Verifikasi"
	| "Batal"
	| "Ditolak"
	| "Proses"
	| "Terima"
	| "BTL";

export interface Cuti {
	usulcuti_id: number;
	pegawai_id: number;
	jeniscuti_id: number;
	usulcuti_tglawal: string;
	usulcuti_tglakhir: string;
	usulcuti_jumlah: number;
	usulcuti_alasan: string;
	usulcuti_alamat: string | null;
	usulcuti_lokasi: string | null;
	usulcuti_status: CutiStatus;
	usulcuti_tgl: string | null;
	usulcuti_masakerja: string | null;
	usulcuti_tembusan: "SKPD" | "BKPP" | null;
	usulcuti_no: number | null;
	usulcuti_kode: string | null;
	atasanlangsung_id: number | null;
	atasanlangsung_jabatan: number | null;
	atasanlangsung_status: string | null;
	pejabat_id: number | null;
	pejabat_jabatan: number | null;
	pejabat_status: string | null;
	skpd_id: number;
	subunit_id: number;
	jabatan_id: number;
	eselon_id: number;
	created_at: string;
	updated_at: string;
	// Joined fields
	pegawai_nama?: string;
	pegawai_nip?: string;
	pegawai_gelardepan?: string | null;
	pegawai_gelarbelakang?: string | null;
	jeniscuti_nama?: string;
	skpd_nama?: string;
	subunit_nama?: string;
	jabatan_nama?: string;
	eselon_nama?: string;
	atasanlangsung_nama?: string;
	pejabat_nama?: string;
}

export interface CreateCutiRequest {
	jeniscuti_id: number;
	usulcuti_tglawal: string;
	usulcuti_tglakhir: string;
	usulcuti_jumlah: number;
	usulcuti_alasan: string;
	usulcuti_alamat: string;
	usulcuti_lokasi: "Dalam Negeri" | "Luar Negeri";
	atasanlangsung_id: number;
	pejabat_id: number;
}

export interface UpdateCutiStatusRequest {
	usulcuti_status?: CutiStatus;
	atasanlangsung_status?: string;
	pejabat_status?: string;
}

export interface CreateBalanceRequest {
	pegawai_id: number;
	jeniscuti_id: number;
	bukucuti_tglawal: string;
	bukucuti_tglakhir: string;
	bukucuti_lama: number;
	bukucuti_tahun: number;
}

export interface UpdateBalanceRequest {
	bukucuti_tglawal?: string;
	bukucuti_tglakhir?: string;
	bukucuti_lama?: number;
}

export interface CutiBalance {
	jeniscuti_id: number;
	jeniscuti_nama: string;
	terpakai: number;
}

// Raw cuti_buku entry from backend GET /cuti/balance
export interface CutiBalanceEntry {
	bukucuti_id: number;
	pegawai_id: number;
	jeniscuti_id: number;
	bukucuti_tahun: number;
	bukucuti_tglawal: string | null;
	bukucuti_tglakhir: string | null;
	bukucuti_lama: number;
	bukucuti_ambil: number;
	bukucuti_status: string;
	bukucuti_edit: string;
	jeniscuti_nama: string;
	jeniscuti_kode: string;
	[key: string]: unknown;
}

export interface CutiStatistics {
	total_pengajuan: number;
	total_disetujui: number;
	total_ditolak: number;
	total_proses: number;
	total_batal: number;
	by_jenis?: Array<{
		jeniscuti_nama: string;
		jeniscuti_kode: string;
		total: number;
	}>;
}

// Raw response from backend GET /cuti/statistics
export interface CutiStatisticsResponse {
	byStatus: Array<{ status: string; jumlah: number }>;
	byJenis: Array<{
		jeniscuti_nama: string;
		jeniscuti_kode: string;
		jumlah: number;
	}>;
}

// ============ Master Data ============

export interface Skpd {
	skpd_id: number;
	skpd_nama: string;
	skpd_singkatan?: string;
}

export interface Subunit {
	subunit_id: number;
	subunit_nama: string;
	skpd_id: number;
}

export interface JenisCuti {
	jeniscuti_id: number;
	jeniscuti_nama: string;
	jeniscuti_kode?: string;
	jeniscuti_maxhari?: number;
	jeniscuti_status?: number;
}

export interface Golongan {
	golongan_id: number;
	golongan_nama: string;
}

export interface Jabatan {
	jabatan_id: number;
	jabatan_nama: string;
}

export interface Eselon {
	eselon_id: number;
	eselon_nama: string;
}

// ============ API Response ============

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface CutiFilters {
	page?: number;
	limit?: number;
	pegawai_id?: number;
	skpd_id?: number;
	subunit_id?: number;
	status?: CutiStatus;
	jeniscuti_id?: number;
	tahun?: number;
}

export interface PegawaiFilters {
	page?: number;
	limit?: number;
	skpd_id?: number;
	subunit_id?: number;
	search?: string;
}

// ============ Laporan ============

export interface LaporanDashboardItem {
	jeniscuti_id: number;
	jeniscuti_nama: string;
	verifikasi: number;
	btl: number;
	ditolak: number;
	batal: number;
	proses: number;
	terima: number;
	total: number;
}

export interface LaporanUsulanItem {
	usulcuti_id: number;
	usulcuti_tgl: string;
	usulcuti_tglawal: string;
	usulcuti_tglakhir: string;
	usulcuti_jumlah: number;
	usulcuti_alasan: string;
	usulcuti_status: CutiStatus;
	usulcuti_masakerja: string | null;
	usulcuti_tembusan: string | null;
	pegawai_id: number;
	pegawai_nip: string;
	pegawai_nama: string;
	pegawai_gelardepan: string | null;
	pegawai_gelarbelakang: string | null;
	jabatan_nama: string;
	subunit_nama: string;
	skpd_nama: string;
	eselon_nama: string | null;
	jeniscuti_nama: string;
}

export interface LaporanRekapItem {
	jeniscuti_id: number;
	jeniscuti_nama: string;
	jan: number;
	feb: number;
	mar: number;
	apr: number;
	mei: number;
	jun: number;
	jul: number;
	ags: number;
	sep: number;
	okt: number;
	nov: number;
	des: number;
	total: number;
}

export interface BukuCutiItem {
	bukucuti_id: number;
	pegawai_id: number;
	jeniscuti_id: number;
	bukucuti_tahun: number;
	bukucuti_status: string;
	jeniscuti_nama: string;
	jeniscuti_kode: string;
	pegawai_nama: string;
	pegawai_nip: string;
	[key: string]: unknown;
}

// ============ Cuti Bersama ============

export interface CutiBersama {
	cutibersama_id: number;
	cutibersama_nama: string;
	cutibersama_tglawal: string;
	cutibersama_tglakhir: string;
	cutibersama_jumlah: number;
	cutibersama_tahun: number;
	cutibersama_file: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateCutiBersamaRequest {
	cutibersama_nama: string;
	cutibersama_tglawal: string;
	cutibersama_tglakhir: string;
	cutibersama_jumlah: number;
	cutibersama_tahun: number;
	cutibersama_file?: string;
}

export interface CutiBersamaFilters {
	tahun?: number;
	page?: number;
	limit?: number;
}

// ============ Cuti Kontrak ============

export interface CutiKontrak {
	usulkontrak_id: number;
	pegawai_id: number;
	jeniscuti_id: number;
	usulcuti_tglawal: string;
	usulcuti_tglakhir: string;
	usulcuti_jumlah: number;
	usulcuti_alasan: string;
	usulcuti_alamat: string;
	usulcuti_status: CutiStatus;
	atasanlangsung_id: number | null;
	atasanlangsung_status: string | null;
	pejabat_id: number | null;
	pejabat_status: string | null;
	created_at: string;
	updated_at?: string;
	// Joined fields
	pegawai_nama?: string;
	pegawai_nip?: string;
	pegawai_gelardepan?: string | null;
	pegawai_gelarbelakang?: string | null;
	skpd_id?: number;
	jeniscuti_nama?: string;
	skpd_nama?: string;
}

export interface CreateCutiKontrakRequest {
	pegawai_id: number;
	jeniscuti_id: number;
	usulcuti_tglawal: string;
	usulcuti_tglakhir: string;
	usulcuti_alasan: string;
	usulcuti_alamat: string;
}

export interface UpdateCutiKontrakStatusRequest {
	usulcuti_status?: CutiStatus;
	atasanlangsung_status?: string;
	pejabat_status?: string;
}

export interface CutiKontrakFilters {
	page?: number;
	limit?: number;
	pegawai_id?: number;
	skpd_id?: number;
	status?: string;
	jeniscuti_id?: number;
	tahun?: number;
}

// ============ Kode Cuti ============

export interface KodeCuti {
	kode_id: number;
	skpd_id: number;
	kode_awal: string;
	kode_tengah: string;
	created_at: string;
	updated_at: string;
}

export interface CreateKodeCutiRequest {
	skpd_id: number;
	kode_awal: string;
	kode_tengah: string;
}

export interface UpdateKodeCutiRequest {
	kode_awal?: string;
	kode_tengah?: string;
}

// ============ Manajemen User ============

export interface UserRoleAssignment {
	pegawai_id: number;
	role_id: number;
	skpd_id: number;
	created_by?: number;
	pegawai_nama?: string;
	pegawai_nip?: string;
	role_nama?: string;
}

export interface AssignRoleRequest {
	pegawai_id: number;
	role_id: number;
	skpd_id: number;
}

export interface UserRoleFilters {
	skpd_id?: number;
	role_id?: number;
	page?: number;
	limit?: number;
}
