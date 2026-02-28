import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Ban, Check, Eye, FileText, Plus, X } from "lucide-react";
import { useState } from "react";
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
import { Card, CardContent } from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	useCancelCutiKontrak,
	useCutiKontrakList,
	useUpdateCutiKontrakStatus,
} from "#/hooks/use-cuti-kontrak";
import { useAuth } from "#/lib/auth";
import type { CutiKontrak, CutiStatus } from "#/types";

export const Route = createFileRoute("/_authenticated/cuti-kontrak/")({
	beforeLoad: () => {
		const stored = localStorage.getItem("user");
		if (stored) {
			const user = JSON.parse(stored);
			if (
				!["Super Admin", "Admin SKPD", "Admin Uker"].includes(user.role)
			) {
				throw redirect({ to: "/" });
			}
		}
	},
	component: CutiKontrakPage,
});

const STATUS_LIST: CutiStatus[] = [
	"Verifikasi",
	"Proses",
	"Terima",
	"Ditolak",
	"Batal",
	"BTL",
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
	currentYear - 2,
	currentYear - 1,
	currentYear,
	currentYear + 1,
	currentYear + 2,
];

const statusConfig: Record<CutiStatus, { className: string; label: string }> = {
	Verifikasi: {
		className: "bg-amber-100 text-amber-800 border-amber-200",
		label: "Menunggu",
	},
	Proses: {
		className: "bg-blue-100 text-blue-800 border-blue-200",
		label: "Proses",
	},
	Terima: {
		className: "bg-green-100 text-green-800 border-green-200",
		label: "Disetujui",
	},
	Ditolak: {
		className: "bg-red-100 text-red-800 border-red-200",
		label: "Ditolak",
	},
	Batal: {
		className: "bg-gray-100 text-gray-700 border-gray-200",
		label: "Batal",
	},
	BTL: {
		className: "bg-orange-100 text-orange-800 border-orange-200",
		label: "BTL",
	},
};

// Row-level action component so each row has its own mutation hook instance
function RowActions({
	item,
	userRole,
	userPegawaiId,
}: {
	item: CutiKontrak;
	userRole: string | undefined;
	userPegawaiId: number | undefined;
}) {
	const updateMutation = useUpdateCutiKontrakStatus(item.usulkontrak_id);
	const cancelMutation = useCancelCutiKontrak(item.usulkontrak_id);

	const isAdmin =
		userRole === "Admin SKPD" ||
		userRole === "Admin Uker" ||
		userRole === "Super Admin";
	const isPegawai = userRole === "Pegawai";
	const isOwner = isPegawai && userPegawaiId === item.pegawai_id;

	const canAdminAct =
		isAdmin &&
		(item.usulcuti_status === "Verifikasi" ||
			item.usulcuti_status === "Proses");

	const canCancel = isOwner && item.usulcuti_status === "Verifikasi";

	function handleApprove() {
		let payload = {};
		if (item.usulcuti_status === "Verifikasi") {
			payload = {
				usulcuti_status: "Proses" as CutiStatus,
				atasanlangsung_status: "Terima",
			};
		} else if (item.usulcuti_status === "Proses") {
			payload = {
				usulcuti_status: "Terima" as CutiStatus,
				pejabat_status: "Terima",
			};
		}
		updateMutation.mutate(payload, {
			onSuccess: () => toast.success("Status berhasil diperbarui"),
			onError: () => toast.error("Gagal memperbarui status"),
		});
	}

	function handleReject() {
		updateMutation.mutate(
			{ usulcuti_status: "Ditolak" },
			{
				onSuccess: () => toast.success("Pengajuan berhasil ditolak"),
				onError: () => toast.error("Gagal menolak pengajuan"),
			},
		);
	}

	function handleCancel() {
		cancelMutation.mutate(undefined, {
			onSuccess: () => toast.success("Pengajuan berhasil dibatalkan"),
			onError: () => toast.error("Gagal membatalkan pengajuan"),
		});
	}

	return (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				className="h-8 gap-1.5 text-muted-foreground"
				asChild
			>
				<Link
					to="/cuti-kontrak/$id"
					params={{ id: String(item.usulkontrak_id) }}
				>
					<Eye className="h-3.5 w-3.5" />
					Lihat
				</Link>
			</Button>
			{canAdminAct && (
				<>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
								disabled={updateMutation.isPending}
							>
								<Check className="h-3.5 w-3.5" />
								Setujui
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Setujui Pengajuan</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menyetujui pengajuan cuti kontrak ini?
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleApprove}
									className="bg-green-600 hover:bg-green-700"
								>
									Ya, Setujui
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1.5 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
								disabled={updateMutation.isPending}
							>
								<X className="h-3.5 w-3.5" />
								Tolak
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Tolak Pengajuan</AlertDialogTitle>
								<AlertDialogDescription>
									Apakah Anda yakin ingin menolak pengajuan cuti kontrak ini?
									Tindakan ini tidak dapat dibatalkan.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Batal</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleReject}
									className="bg-destructive hover:bg-destructive/90"
								>
									Ya, Tolak
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</>
			)}

			{canCancel && (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-gray-600 border-gray-300 hover:bg-gray-50"
							disabled={cancelMutation.isPending}
						>
							<Ban className="h-3.5 w-3.5" />
							Batalkan
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Batalkan Pengajuan</AlertDialogTitle>
							<AlertDialogDescription>
								Apakah Anda yakin ingin membatalkan pengajuan cuti kontrak ini?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Tidak</AlertDialogCancel>
							<AlertDialogAction onClick={handleCancel}>
								Ya, Batalkan
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</div>
	);
}

function CutiKontrakPage() {
	const { user } = useAuth();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");
	const [tahun, setTahun] = useState<string>(String(currentYear));

	const { data, isLoading, isError } = useCutiKontrakList({
		page,
		limit: 10,
		status: status && status !== "all" ? status : undefined,
		tahun: tahun && tahun !== "all" ? Number(tahun) : undefined,
	});

	const isPegawai = user?.role === "Pegawai";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Cuti Kontrak</h2>
					<p className="text-muted-foreground">
						Daftar pengajuan cuti pegawai kontrak
					</p>
				</div>
				{isPegawai && (
					<Button asChild>
						<Link to="/cuti-kontrak/buat">
							<Plus className="mr-2 h-4 w-4" />
							Ajukan Cuti
						</Link>
					</Button>
				)}
			</div>

			<Card>
				{/* Clean toolbar — no CardTitle "Filter" label */}
				<div className="flex items-center gap-3 flex-wrap border-b px-6 py-3">
					<Select
						value={status}
						onValueChange={(v) => {
							setStatus(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-[180px] h-9">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							{STATUS_LIST.map((s) => (
								<SelectItem key={s} value={s}>
									{statusConfig[s]?.label ?? s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={tahun}
						onValueChange={(v) => {
							setTahun(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-[140px] h-9">
							<SelectValue placeholder="Tahun" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Tahun</SelectItem>
							{YEAR_OPTIONS.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-3 p-6">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : isError ? (
						<div className="py-16 text-center">
							<div className="flex flex-col items-center gap-3 text-muted-foreground">
								<FileText className="h-10 w-10 opacity-30" />
								<div>
									<p className="font-medium text-sm">Gagal memuat data</p>
									<p className="text-xs mt-1">Silakan coba lagi nanti.</p>
								</div>
							</div>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="w-12">No</TableHead>
										<TableHead>Nama Pegawai</TableHead>
										<TableHead>Jenis Cuti</TableHead>
										<TableHead>Tanggal</TableHead>
										<TableHead className="text-center">Hari</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.data && data.data.length > 0 ? (
										data.data.map((item, index) => {
											const cfg = statusConfig[item.usulcuti_status];
											return (
												<TableRow
													key={item.usulkontrak_id}
													className="hover:bg-muted/40 transition-colors"
												>
													<TableCell className="text-sm text-muted-foreground">
														{(page - 1) * 10 + index + 1}
													</TableCell>
													<TableCell>
														<div>
															<div className="font-medium">
																{[
																	item.pegawai_gelardepan,
																	item.pegawai_nama,
																	item.pegawai_gelarbelakang,
																]
																	.filter(Boolean)
																	.join(" ")}
															</div>
															{item.pegawai_nip && (
																<div className="text-xs text-muted-foreground font-mono">
																	{item.pegawai_nip}
																</div>
															)}
														</div>
													</TableCell>
													<TableCell className="text-sm">
														{item.jeniscuti_nama ?? "-"}
													</TableCell>
													<TableCell className="text-sm whitespace-nowrap">
														{format(
															new Date(item.usulcuti_tglawal),
															"d MMM yyyy",
															{
																locale: localeId,
															},
														)}{" "}
														–{" "}
														{format(
															new Date(item.usulcuti_tglakhir),
															"d MMM yyyy",
															{
																locale: localeId,
															},
														)}
													</TableCell>
													<TableCell className="text-center">
														<Badge
															variant="secondary"
															className="bg-blue-50 text-blue-700 border-blue-200"
														>
															{item.usulcuti_jumlah} hari
														</Badge>
													</TableCell>
													<TableCell>
														<Badge
															variant="secondary"
															className={cfg?.className ?? ""}
														>
															{cfg?.label ?? item.usulcuti_status}
														</Badge>
													</TableCell>
													<TableCell>
														<RowActions
															item={item}
															userRole={user?.role}
															userPegawaiId={user?.pegawai_id}
														/>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell colSpan={7} className="py-16 text-center">
												<div className="flex flex-col items-center gap-3 text-muted-foreground">
													<FileText className="h-10 w-10 opacity-30" />
													<div>
														<p className="font-medium text-sm">
															Belum ada pengajuan cuti kontrak
														</p>
														<p className="text-xs mt-1">
															{isPegawai
																? 'Klik "Ajukan Cuti" untuk membuat pengajuan baru.'
																: "Belum ada data pengajuan cuti kontrak untuk filter yang dipilih."}
														</p>
													</div>
												</div>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>

							{data && data.total > 10 && (
								<div className="flex items-center justify-between border-t px-6 py-3">
									<p className="text-sm text-muted-foreground">
										Menampilkan {(page - 1) * 10 + 1}–
										{Math.min(page * 10, data.total)} dari {data.total} data
									</p>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
										>
											Sebelumnya
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => p + 1)}
											disabled={page * 10 >= data.total}
										>
											Selanjutnya
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
