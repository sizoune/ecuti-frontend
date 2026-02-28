import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
	ArrowLeft,
	Building2,
	CalendarDays,
	CheckCircle2,
	Download,
	ExternalLink,
	FileText,
	Loader2,
	MapPin,
	Paperclip,
	Printer,
	Upload,
	User,
	Users,
	XCircle,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import {
	useCancelCuti,
	useCutiDetail,
	useFilePengantarUrl,
	useFileSKUrl,
	useUpdateCutiStatus,
	useUploadFileSK,
} from "#/hooks/use-cuti";
import { useAuth } from "#/lib/auth";
import { formatNamaGelar } from "#/lib/utils";
import type { CutiStatus } from "#/types";

export const Route = createFileRoute("/_authenticated/cuti/$id")({
	component: CutiDetailPage,
});

const statusConfig: Record<
	CutiStatus,
	{ label: string; className: string; badgeClassName: string }
> = {
	Verifikasi: {
		label: "Menunggu Verifikasi",
		className: "bg-yellow-50 border-yellow-200 text-yellow-800",
		badgeClassName: "bg-yellow-100 text-yellow-800 border border-yellow-200",
	},
	Proses: {
		label: "Sedang Diproses",
		className: "bg-blue-50 border-blue-200 text-blue-800",
		badgeClassName: "bg-blue-100 text-blue-800 border border-blue-200",
	},
	Terima: {
		label: "Disetujui",
		className: "bg-green-50 border-green-200 text-green-800",
		badgeClassName: "bg-green-100 text-green-800 border border-green-200",
	},
	Ditolak: {
		label: "Ditolak",
		className: "bg-red-50 border-red-200 text-red-800",
		badgeClassName: "bg-red-100 text-red-800 border border-red-200",
	},
	Batal: {
		label: "Dibatalkan",
		className: "bg-gray-50 border-gray-200 text-gray-700",
		badgeClassName: "bg-gray-100 text-gray-700 border border-gray-200",
	},
	BTL: {
		label: "BTL",
		className: "bg-orange-50 border-orange-200 text-orange-800",
		badgeClassName: "bg-orange-100 text-orange-800 border border-orange-200",
	},
};

function ApprovalStatusBadge({
	status,
}: {
	status: string | null | undefined;
}) {
	if (!status) return <span className="text-sm text-muted-foreground">—</span>;
	const isApproved = status === "Terima" || status === "Setuju";
	const isRejected = status === "Ditolak" || status === "Tolak";
	return (
		<span
			className={`inline-flex items-center gap-1 text-sm font-medium ${
				isApproved
					? "text-green-700"
					: isRejected
						? "text-red-700"
						: "text-muted-foreground"
			}`}
		>
			{isApproved && <CheckCircle2 className="h-3.5 w-3.5" />}
			{isRejected && <XCircle className="h-3.5 w-3.5" />}
			{status}
		</span>
	);
}

function DetailSection({
	icon: Icon,
	title,
	children,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
					<Icon className="h-3.5 w-3.5 text-muted-foreground" />
				</div>
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{title}
				</span>
			</div>
			<div className="grid gap-2.5 pl-8 sm:grid-cols-2">{children}</div>
		</div>
	);
}

function InfoRow({
	label,
	children,
	wide,
}: {
	label: string;
	children: React.ReactNode;
	wide?: boolean;
}) {
	return (
		<div className={wide ? "sm:col-span-2" : undefined}>
			<p className="text-xs text-muted-foreground">{label}</p>
			<div className="mt-0.5 text-sm font-medium">{children}</div>
		</div>
	);
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function CutiDetailPage() {
	const { id } = Route.useParams();
	const numId = Number(id);
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: cuti, isLoading } = useCutiDetail(numId);
	const updateStatus = useUpdateCutiStatus(numId);
	const cancelCuti = useCancelCuti(numId);
	const filePengantar = useFilePengantarUrl(numId);
	const fileSK = useFileSKUrl(numId);
	const uploadSK = useUploadFileSK(numId);
	const skFileInputRef = useRef<HTMLInputElement>(null);

	const isAdmin = user && user.role !== "Pegawai";
	const isSuperAdmin = user?.role === "Super Admin";
	const isOwner = cuti && cuti.pegawai_id === user?.pegawai_id;
	const canCancel = isOwner && cuti?.usulcuti_status === "Verifikasi";
	const canVerify = isAdmin && cuti?.usulcuti_status === "Verifikasi";

	const handleSKUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf") {
			toast.error("File SK harus berformat PDF");
			e.target.value = "";
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error("Ukuran file tidak boleh lebih dari 2 MB");
			e.target.value = "";
			return;
		}
		try {
			await uploadSK.mutateAsync(file);
			toast.success("File SK berhasil diunggah");
		} catch {
			toast.error("Gagal mengunggah file SK");
		}
		e.target.value = "";
	};

	const handlePrint = () => {
		window.print();
	};

	const handleStatusUpdate = async (status: CutiStatus) => {
		try {
			await updateStatus.mutateAsync({ usulcuti_status: status });
			toast.success(
				status === "Terima"
					? "Cuti berhasil disetujui"
					: status === "Ditolak"
						? "Cuti berhasil ditolak"
						: "Status cuti berhasil diperbarui",
			);
		} catch {
			toast.error("Gagal memperbarui status cuti");
		}
	};

	const handleCancel = async () => {
		try {
			await cancelCuti.mutateAsync();
			toast.success("Pengajuan cuti berhasil dibatalkan");
		} catch {
			toast.error("Gagal membatalkan pengajuan cuti");
		}
	};

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-[500px]" />
			</div>
		);
	}

	if (!cuti) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
				<FileText className="h-12 w-12 text-muted-foreground/40" />
				<div>
					<p className="font-medium text-muted-foreground">
						Data tidak ditemukan
					</p>
					<p className="mt-1 text-sm text-muted-foreground/70">
						Pengajuan cuti ini tidak ada atau sudah dihapus.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/cuti">Kembali ke daftar</Link>
				</Button>
			</div>
		);
	}

	const cfg = statusConfig[cuti.usulcuti_status];

	return (
		<div className="mx-auto max-w-2xl space-y-5">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/cuti" })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h2 className="text-2xl font-bold tracking-tight">Detail Cuti</h2>
					<p className="text-sm text-muted-foreground">
						Pengajuan #{cuti.usulcuti_id}
					</p>
				</div>
			</div>

			{/* Status Banner */}
			<div className={`rounded-lg border px-4 py-3 ${cfg.className}`}>
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-xs font-medium uppercase tracking-wider opacity-70">
							Status Pengajuan
						</p>
						<p className="mt-0.5 text-base font-semibold">{cfg.label}</p>
					</div>
					<Badge
						variant="secondary"
						className={`text-sm ${cfg.badgeClassName}`}
					>
						{cuti.usulcuti_status}
					</Badge>
				</div>
			</div>

			{/* Detail Card */}
			<Card>
				<CardHeader className="border-b pb-4">
					<CardTitle className="text-base">Informasi Pengajuan</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6 pt-5">
					{/* Pegawai */}
					<DetailSection icon={User} title="Data Pegawai">
						<InfoRow label="Nama" wide>
							{formatNamaGelar(
								cuti.pegawai_nama ?? "",
								cuti.pegawai_gelardepan,
								cuti.pegawai_gelarbelakang,
							)}
						</InfoRow>
						<InfoRow label="NIP">{cuti.pegawai_nip ?? "—"}</InfoRow>
						<InfoRow label="Jabatan">{cuti.jabatan_nama ?? "—"}</InfoRow>
						<InfoRow label="SKPD">{cuti.skpd_nama ?? "—"}</InfoRow>
						<InfoRow label="Unit Kerja">{cuti.subunit_nama ?? "—"}</InfoRow>
					</DetailSection>

					<Separator />

					{/* Jenis & Periode */}
					<DetailSection icon={CalendarDays} title="Jenis &amp; Periode Cuti">
						<InfoRow label="Jenis Cuti" wide>
							{cuti.jeniscuti_nama ?? "—"}
						</InfoRow>
						<InfoRow label="Tanggal Mulai">
							{format(new Date(cuti.usulcuti_tglawal), "dd MMMM yyyy", {
								locale: localeId,
							})}
						</InfoRow>
						<InfoRow label="Tanggal Selesai">
							{format(new Date(cuti.usulcuti_tglakhir), "dd MMMM yyyy", {
								locale: localeId,
							})}
						</InfoRow>
						<InfoRow label="Jumlah Hari">
							<span className="font-semibold">{cuti.usulcuti_jumlah} hari</span>
						</InfoRow>
					</DetailSection>

					<Separator />

					{/* Detail Cuti */}
					<DetailSection icon={FileText} title="Detail Cuti">
						<InfoRow label="Alasan" wide>
							{cuti.usulcuti_alasan}
						</InfoRow>
						<InfoRow label="Alamat Selama Cuti" wide>
							{cuti.usulcuti_alamat ?? "—"}
						</InfoRow>
						<InfoRow label="Lokasi">
							<span className="inline-flex items-center gap-1">
								<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
								{cuti.usulcuti_lokasi ?? "—"}
							</span>
						</InfoRow>
					</DetailSection>

					<Separator />

					{/* Persetujuan */}
					<DetailSection icon={Users} title="Persetujuan">
						<InfoRow label="Atasan Langsung">
							{cuti.atasanlangsung_nama ?? "—"}
						</InfoRow>
						<InfoRow label="Status Atasan">
							<ApprovalStatusBadge status={cuti.atasanlangsung_status} />
						</InfoRow>
						<InfoRow label="Pejabat Berwenang">
							{cuti.pejabat_nama ?? "—"}
						</InfoRow>
						<InfoRow label="Status Pejabat">
							<ApprovalStatusBadge status={cuti.pejabat_status} />
						</InfoRow>
					</DetailSection>

					<Separator />

					{/* Meta */}
					<DetailSection icon={Building2} title="Informasi Pengajuan">
						<InfoRow label="Tanggal Pengajuan" wide>
							{format(new Date(cuti.created_at), "dd MMMM yyyy, HH:mm", {
								locale: localeId,
							})}{" "}
							WIB
						</InfoRow>
					</DetailSection>

					<Separator />

					{/* Dokumen */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
								<Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
							</div>
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Dokumen
							</span>
						</div>
						<div className="flex flex-wrap gap-3 pl-8">
							{/* File Pengantar */}
							{filePengantar.isLoading ? (
								<Skeleton className="h-9 w-40" />
							) : filePengantar.data?.url ? (
								<Button variant="outline" size="sm" asChild>
									<a
										href={filePengantar.data.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Download className="mr-2 h-3.5 w-3.5" />
										File Pengantar
										<ExternalLink className="ml-2 h-3 w-3 opacity-60" />
									</a>
								</Button>
							) : (
								<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
									<FileText className="h-3.5 w-3.5" />
									File pengantar belum diunggah
								</span>
							)}

							{/* File SK */}
							{fileSK.isLoading ? (
								<Skeleton className="h-9 w-32" />
							) : fileSK.data?.url ? (
								<Button variant="outline" size="sm" asChild>
									<a
										href={fileSK.data.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Download className="mr-2 h-3.5 w-3.5" />
										File SK
										<ExternalLink className="ml-2 h-3 w-3 opacity-60" />
									</a>
								</Button>
							) : (
								<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
									<FileText className="h-3.5 w-3.5" />
									File SK belum diunggah
								</span>
							)}

							{/* Upload SK — Super Admin only */}
							{isSuperAdmin && (
								<>
									<input
										ref={skFileInputRef}
										type="file"
										accept=".pdf,application/pdf"
										className="hidden"
										onChange={handleSKUpload}
									/>
									<Button
										variant="outline"
										size="sm"
										disabled={uploadSK.isPending}
										onClick={() => skFileInputRef.current?.click()}
									>
										{uploadSK.isPending ? (
											<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
										) : (
											<Upload className="mr-2 h-3.5 w-3.5" />
										)}
										Upload SK
									</Button>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Print */}
				<Button
					variant="outline"
					onClick={handlePrint}
					className="print:hidden"
				>
					<Printer className="mr-2 h-4 w-4" />
					Cetak Surat Cuti
				</Button>

				{canVerify && (
					<>
						<Button
							onClick={() => handleStatusUpdate("Terima")}
							disabled={updateStatus.isPending}
							className="bg-green-600 hover:bg-green-700"
						>
							{updateStatus.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Setujui
						</Button>
						<Button
							variant="destructive"
							onClick={() => handleStatusUpdate("Ditolak")}
							disabled={updateStatus.isPending}
						>
							<XCircle className="mr-2 h-4 w-4" />
							Tolak
						</Button>
					</>
				)}
				{canCancel && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="text-destructive hover:text-destructive"
							>
								Batalkan Pengajuan
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Batalkan Pengajuan Cuti?</AlertDialogTitle>
								<AlertDialogDescription>
									Pengajuan cuti ini akan dibatalkan dan tidak dapat diurungkan.
									Anda perlu membuat pengajuan baru jika ingin mengajukan
									kembali.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Tidak, Kembali</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleCancel}
									disabled={cancelCuti.isPending}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									{cancelCuti.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Ya, Batalkan
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>

			{/* Print-only layout */}
			<style>{`
        @media print {
          body * { visibility: hidden; }
          #print-surat-cuti, #print-surat-cuti * { visibility: visible; }
          #print-surat-cuti {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
			<div id="print-surat-cuti" className="hidden print:!block">
				<div
					style={{
						fontFamily: "serif",
						padding: "40px",
						maxWidth: "700px",
						margin: "0 auto",
					}}
				>
					<div style={{ textAlign: "center", marginBottom: "24px" }}>
						<h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
							SURAT CUTI
						</h2>
						<p style={{ margin: "4px 0 0" }}>
							Nomor: {cuti.usulcuti_kode ?? "—"}
						</p>
					</div>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "14px",
						}}
					>
						<tbody>
							<tr>
								<td style={{ padding: "4px 8px", width: "200px" }}>Nama</td>
								<td style={{ padding: "4px 8px" }}>
									:{" "}
									{formatNamaGelar(
										cuti.pegawai_nama ?? "",
										cuti.pegawai_gelardepan,
										cuti.pegawai_gelarbelakang,
									)}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>NIP</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.pegawai_nip ?? "—"}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Jabatan</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.jabatan_nama ?? "—"}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Unit Kerja</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.subunit_nama ?? "—"}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>SKPD</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.skpd_nama ?? "—"}
								</td>
							</tr>
							<tr>
								<td colSpan={2} style={{ padding: "8px" }} />
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Jenis Cuti</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.jeniscuti_nama ?? "—"}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Tanggal Mulai</td>
								<td style={{ padding: "4px 8px" }}>
									:{" "}
									{format(new Date(cuti.usulcuti_tglawal), "dd MMMM yyyy", {
										locale: localeId,
									})}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Tanggal Selesai</td>
								<td style={{ padding: "4px 8px" }}>
									:{" "}
									{format(new Date(cuti.usulcuti_tglakhir), "dd MMMM yyyy", {
										locale: localeId,
									})}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Jumlah Hari</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.usulcuti_jumlah} hari
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Alasan</td>
								<td style={{ padding: "4px 8px" }}>: {cuti.usulcuti_alasan}</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Alamat Selama Cuti</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.usulcuti_alamat ?? "—"}
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Lokasi</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.usulcuti_lokasi ?? "—"}
								</td>
							</tr>
							<tr>
								<td colSpan={2} style={{ padding: "8px" }} />
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Atasan Langsung</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.atasanlangsung_nama ?? "—"} (
									{cuti.atasanlangsung_status ?? "—"})
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Pejabat Berwenang</td>
								<td style={{ padding: "4px 8px" }}>
									: {cuti.pejabat_nama ?? "—"} ({cuti.pejabat_status ?? "—"})
								</td>
							</tr>
							<tr>
								<td style={{ padding: "4px 8px" }}>Status</td>
								<td style={{ padding: "4px 8px" }}>
									: {statusConfig[cuti.usulcuti_status].label}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
