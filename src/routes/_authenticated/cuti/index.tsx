import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarX2, ChevronRight, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
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
import { useCutiList } from "#/hooks/use-cuti";
import { useAuth } from "#/lib/auth";
import { formatNamaGelar } from "#/lib/utils";
import type { CutiStatus } from "#/types";

export const Route = createFileRoute("/_authenticated/cuti/")({
	component: CutiListPage,
});

const statusConfig: Record<CutiStatus, { label: string; className: string }> = {
	Verifikasi: {
		label: "Verifikasi",
		className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
	},
	Proses: {
		label: "Proses",
		className: "bg-blue-100 text-blue-800 border border-blue-200",
	},
	Terima: {
		label: "Disetujui",
		className: "bg-green-100 text-green-800 border border-green-200",
	},
	Ditolak: {
		label: "Ditolak",
		className: "bg-red-100 text-red-800 border border-red-200",
	},
	Batal: {
		label: "Batal",
		className: "bg-gray-100 text-gray-700 border border-gray-200",
	},
	BTL: {
		label: "BTL",
		className: "bg-orange-100 text-orange-800 border border-orange-200",
	},
};

function CutiListPage() {
	const { user } = useAuth();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");

	const { data, isLoading, isError } = useCutiList({
		page,
		limit: 10,
		status: (status && status !== "all" ? status : undefined) as
			| CutiStatus
			| undefined,
	});

	const colSpan = user?.role !== "Pegawai" ? 7 : 6;

	return (
		<div className="space-y-5">
			{/* Page Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Pengajuan Cuti</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{user?.role === "Pegawai"
							? "Kelola dan pantau status pengajuan cuti Anda"
							: "Daftar seluruh pengajuan cuti pegawai"}
					</p>
				</div>
				<Button asChild className="shrink-0">
					<Link to="/cuti/buat">
						<Plus className="mr-2 h-4 w-4" />
						Ajukan Cuti
					</Link>
				</Button>
			</div>

			<Card>
				{/* Toolbar */}
				<CardHeader className="border-b px-5 py-3.5">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm font-medium text-muted-foreground">
							Filter:
						</span>
						<Select
							value={status}
							onValueChange={(v) => {
								setStatus(v);
								setPage(1);
							}}
						>
							<SelectTrigger className="h-8 w-[160px] text-sm">
								<SelectValue placeholder="Semua Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="Verifikasi">Verifikasi</SelectItem>
								<SelectItem value="Proses">Proses</SelectItem>
								<SelectItem value="Terima">Disetujui</SelectItem>
								<SelectItem value="Ditolak">Ditolak</SelectItem>
								<SelectItem value="Batal">Batal</SelectItem>
							</SelectContent>
						</Select>
						{status && status !== "all" && (
							<button
								onClick={() => {
									setStatus("");
									setPage(1);
								}}
								className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
							>
								Hapus filter
							</button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="space-y-0">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="border-b px-5 py-3.5 last:border-0">
									<Skeleton className="h-5 w-full" />
								</div>
							))}
						</div>
					) : isError ? (
						<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
							<CalendarX2 className="h-12 w-12 text-muted-foreground/40" />
							<div>
								<p className="font-medium text-muted-foreground">
									Gagal memuat data
								</p>
								<p className="mt-1 text-sm text-muted-foreground/70">
									Silakan muat ulang halaman atau coba lagi nanti.
								</p>
							</div>
						</div>
					) : (
						<>
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow className="bg-muted/30 hover:bg-muted/30">
										<TableHead className="w-[13%] pl-5">Tanggal Pengajuan</TableHead>
										{user?.role !== "Pegawai" && <TableHead>Pegawai</TableHead>}
										<TableHead>Jenis Cuti</TableHead>
										<TableHead>Periode</TableHead>
										<TableHead className="w-[7%] text-center">Hari</TableHead>
										<TableHead className="w-[12%]">Status</TableHead>
										<TableHead className="w-[8%] pr-5" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.data && data.data.length > 0 ? (
										data.data.map((cuti) => (
											<TableRow
												key={cuti.usulcuti_id}
												className="cursor-pointer transition-colors hover:bg-muted/40"
											>
												<TableCell className="pl-5 text-sm">
													{format(new Date(cuti.created_at), "dd MMM yyyy", {
														locale: localeId,
													})}
												</TableCell>
												{user?.role !== "Pegawai" && (
													<TableCell className="whitespace-normal">
														<div>
															<div className="font-medium leading-snug">
																{formatNamaGelar(
																	cuti.pegawai_nama ?? "",
																	cuti.pegawai_gelardepan,
																	cuti.pegawai_gelarbelakang,
																)}
															</div>
															<div className="text-xs text-muted-foreground">
																{cuti.pegawai_nip}
															</div>
														</div>
													</TableCell>
												)}
												<TableCell className="text-sm overflow-hidden text-ellipsis">
													{cuti.jeniscuti_nama}
												</TableCell>
												<TableCell className="text-sm tabular-nums overflow-hidden text-ellipsis">
													{format(
														new Date(cuti.usulcuti_tglawal),
														"dd/MM/yyyy",
													)}
													{" — "}
													{format(
														new Date(cuti.usulcuti_tglakhir),
														"dd/MM/yyyy",
													)}
												</TableCell>
												<TableCell className="text-center text-sm font-medium">
													{cuti.usulcuti_jumlah}
												</TableCell>
												<TableCell className="overflow-hidden">
													<Badge
														variant="secondary"
														className={`font-medium ${statusConfig[cuti.usulcuti_status].className}`}
													>
														{statusConfig[cuti.usulcuti_status].label}
													</Badge>
												</TableCell>
												<TableCell className="pr-5">
													<Button
														variant="ghost"
														size="sm"
														className="h-7 gap-1 text-xs"
														asChild
													>
														<Link
															to="/cuti/$id"
															params={{ id: String(cuti.usulcuti_id) }}
														>
															Detail
															<ChevronRight className="h-3 w-3" />
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={colSpan} className="py-0">
												<div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
													<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
														<CalendarX2 className="h-8 w-8 text-muted-foreground/60" />
													</div>
													<div>
														<p className="font-medium">
															Belum ada pengajuan cuti
														</p>
														<p className="mt-1 text-sm text-muted-foreground">
															{status && status !== "all"
																? "Tidak ada cuti dengan status ini."
																: "Anda belum pernah mengajukan cuti."}
														</p>
													</div>
													{(!status || status === "all") && (
														<Button asChild size="sm">
															<Link to="/cuti/buat">
																<Plus className="mr-2 h-4 w-4" />
																Ajukan Cuti Sekarang
															</Link>
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>

							{data && data.total > 10 && (
								<div className="flex items-center justify-between border-t px-5 py-3.5">
									<p className="text-sm text-muted-foreground">
										{(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} dari{" "}
										{data.total} data
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
