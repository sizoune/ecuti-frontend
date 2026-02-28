import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { differenceInCalendarDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
	ArrowLeft,
	Building2,
	CalendarDays,
	CheckCircle2,
	FileText,
	Loader2,
	User,
	XCircle,
} from "lucide-react";
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
	useCancelCutiKontrak,
	useCutiKontrakDetail,
	useUpdateCutiKontrakStatus,
} from "#/hooks/use-cuti-kontrak";
import { useAuth } from "#/lib/auth";
import { formatNamaGelar } from "#/lib/utils";
import type { CutiStatus } from "#/types";

export const Route = createFileRoute("/_authenticated/cuti-kontrak/$id")({
	beforeLoad: () => {
		const stored = localStorage.getItem("user");
		if (stored) {
			const user = JSON.parse(stored);
			if (!["Super Admin", "Admin SKPD", "Admin Uker"].includes(user.role)) {
				throw redirect({ to: "/" });
			}
		}
	},
	component: CutiKontrakDetail,
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

function CutiKontrakDetail() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { data: cuti, isLoading } = useCutiKontrakDetail(Number(id));
	const updateStatus = useUpdateCutiKontrakStatus(Number(id));
	const cancelCuti = useCancelCutiKontrak(Number(id));

	const isAdmin = user && user.role !== "Pegawai";
	const isOwner = cuti && cuti.pegawai_id === user?.pegawai_id;
	const canCancel = isOwner && cuti?.usulcuti_status === "Verifikasi";
	const canVerify =
		isAdmin &&
		(cuti?.usulcuti_status === "Verifikasi" ||
			cuti?.usulcuti_status === "Proses");

	const handleStatusUpdate = async (status: CutiStatus) => {
		try {
			let payload: {
				usulcuti_status: CutiStatus;
				atasanlangsung_status?: string;
				pejabat_status?: string;
			} = {
				usulcuti_status: status,
			};
			if (status === "Terima") {
				if (cuti?.usulcuti_status === "Verifikasi") {
					payload = {
						usulcuti_status: "Proses",
						atasanlangsung_status: "Terima",
					};
				} else if (cuti?.usulcuti_status === "Proses") {
					payload = {
						usulcuti_status: "Terima",
						pejabat_status: "Terima",
					};
				}
			}
			await updateStatus.mutateAsync(payload);
			toast.success(
				status === "Terima"
					? "Cuti kontrak berhasil disetujui"
					: status === "Ditolak"
						? "Cuti kontrak berhasil ditolak"
						: "Status cuti kontrak berhasil diperbarui",
			);
		} catch {
			toast.error("Gagal memperbarui status cuti kontrak");
		}
	};

	const handleCancel = async () => {
		try {
			await cancelCuti.mutateAsync();
			toast.success("Pengajuan cuti kontrak berhasil dibatalkan");
		} catch {
			toast.error("Gagal membatalkan pengajuan cuti kontrak");
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
						Pengajuan cuti kontrak ini tidak ada atau sudah dihapus.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/cuti-kontrak">Kembali ke daftar</Link>
				</Button>
			</div>
		);
	}

	const cfg = cuti.usulcuti_status
		? (statusConfig[cuti.usulcuti_status] ?? {
				label: cuti.usulcuti_status,
				className: "bg-gray-50 border-gray-200 text-gray-700",
				badgeClassName: "bg-gray-100 text-gray-700 border border-gray-200",
			})
		: null;

	return (
		<div className="mx-auto max-w-2xl space-y-5">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/cuti-kontrak" })}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h2 className="text-2xl font-bold tracking-tight">
						Detail Cuti Kontrak
					</h2>
					<p className="text-sm text-muted-foreground">
						Pengajuan #{cuti.usulkontrak_id}
					</p>
				</div>
			</div>

			{/* Status Banner */}
			{cfg && (
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
			)}

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
						<InfoRow label="SKPD">{cuti.skpd_nama ?? "—"}</InfoRow>
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
							<span className="font-semibold">
								{cuti.usulcuti_jumlah ??
									differenceInCalendarDays(
										new Date(cuti.usulcuti_tglakhir),
										new Date(cuti.usulcuti_tglawal),
									) + 1}{" "}
								hari
							</span>
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
				</CardContent>
			</Card>

			{/* Action Buttons */}
			{(canVerify || canCancel) && (
				<div className="flex items-center gap-3">
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
									<AlertDialogTitle>
										Batalkan Pengajuan Cuti Kontrak?
									</AlertDialogTitle>
									<AlertDialogDescription>
										Pengajuan cuti kontrak ini akan dibatalkan dan tidak dapat
										diurungkan. Anda perlu membuat pengajuan baru jika ingin
										mengajukan kembali.
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
			)}
		</div>
	);
}
