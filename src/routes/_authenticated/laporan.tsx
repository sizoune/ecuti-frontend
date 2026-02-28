import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	Calendar,
	Download,
	FileText,
	FileX,
	Pencil,
	Plus,
	Search,
	TableProperties,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
	useCreateBalance,
	useCutiBalanceEntries,
	useDeleteBalance,
	useUpdateBalance,
} from "#/hooks/use-cuti";
import {
	useBukuCuti,
	useLaporanCutiBulanan,
	useLaporanDashboard,
	useLaporanRekapitulasi,
} from "#/hooks/use-laporan";
import { useJenisCutiList } from "#/hooks/use-master";
import { usePegawaiSearch } from "#/hooks/use-pegawai";
import { useAuth } from "#/lib/auth";
import { formatNamaGelar } from "#/lib/utils";
import type {
	CutiBalanceEntry,
	CutiStatus,
	LaporanDashboardItem,
} from "#/types";

export const Route = createFileRoute("/_authenticated/laporan")({
	beforeLoad: () => {
		const stored = localStorage.getItem("user");
		if (!stored) {
			throw redirect({ to: "/" });
		}
		try {
			JSON.parse(stored);
		} catch {
			throw redirect({ to: "/" });
		}
	},
	component: LaporanPage,
});

const STATUS_COLORS: Record<string, string> = {
	Verifikasi: "#3b82f6",
	BTL: "#6366f1",
	Ditolak: "#ef4444",
	Batal: "#6b7280",
	Proses: "#f59e0b",
	Terima: "#22c55e",
};

const BULAN_OPTIONS = [
	{ value: "1", label: "Januari" },
	{ value: "2", label: "Februari" },
	{ value: "3", label: "Maret" },
	{ value: "4", label: "April" },
	{ value: "5", label: "Mei" },
	{ value: "6", label: "Juni" },
	{ value: "7", label: "Juli" },
	{ value: "8", label: "Agustus" },
	{ value: "9", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

const BULAN_LABELS: Record<string, string> = {
	"1": "Januari",
	"2": "Februari",
	"3": "Maret",
	"4": "April",
	"5": "Mei",
	"6": "Juni",
	"7": "Juli",
	"8": "Agustus",
	"9": "September",
	"10": "Oktober",
	"11": "November",
	"12": "Desember",
};

function getStatusVariant(status: CutiStatus) {
	switch (status) {
		case "Terima":
			return "default" as const;
		case "Ditolak":
			return "destructive" as const;
		case "Batal":
		case "BTL":
			return "secondary" as const;
		default:
			return "outline" as const;
	}
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
			<FileX className="h-10 w-10 opacity-40" />
			<p className="text-sm">{message}</p>
		</div>
	);
}

// ============ Export Helpers ============

function exportToCsv(filename: string, headers: string[], rows: string[][]) {
	const csvContent = [
		headers.join(","),
		...rows.map((row) =>
			row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
		),
	].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function printTable(title: string, tableId: string) {
	const tableEl = document.getElementById(tableId);
	if (!tableEl) return;

	const printWindow = window.open("", "_blank");
	if (!printWindow) return;

	const styleEl = printWindow.document.createElement("style");
	styleEl.textContent = `
		body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
		h2 { margin-bottom: 12px; }
		table { border-collapse: collapse; width: 100%; }
		th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
		th { background-color: #f0f0f0; font-weight: bold; }
		tr:nth-child(even) { background-color: #f9f9f9; }
		@media print { body { margin: 0; } }
	`;

	const heading = printWindow.document.createElement("h2");
	heading.textContent = title;

	const clonedTable = tableEl.cloneNode(true) as HTMLElement;

	printWindow.document.head.appendChild(styleEl);
	printWindow.document.body.appendChild(heading);
	printWindow.document.body.appendChild(clonedTable);

	printWindow.focus();
	printWindow.print();
	printWindow.close();
}

// ============ Main Page ============

function LaporanPage() {
	const { user } = useAuth();
	const isAdmin = user && user.role !== "Pegawai";
	const isPegawai = user?.role === "Pegawai";
	const isSuperAdmin = user?.role === "Super Admin";

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Laporan</h2>
				<p className="text-muted-foreground">Laporan dan rekap data cuti</p>
			</div>

			<Tabs defaultValue="dashboard">
				<TabsList>
					<TabsTrigger value="dashboard" className="gap-1.5">
						<BarChart3 className="h-4 w-4" />
						Dashboard
					</TabsTrigger>
					{isAdmin && (
						<TabsTrigger value="cuti-bulanan" className="gap-1.5">
							<Calendar className="h-4 w-4" />
							Cuti Bulanan
						</TabsTrigger>
					)}
					{isAdmin && (
						<TabsTrigger value="rekapitulasi" className="gap-1.5">
							<TableProperties className="h-4 w-4" />
							Rekapitulasi
						</TabsTrigger>
					)}
					<TabsTrigger value="buku-cuti" className="gap-1.5">
						<BookOpen className="h-4 w-4" />
						Buku Cuti
					</TabsTrigger>
				</TabsList>

				<TabsContent value="dashboard">
					<DashboardTab />
				</TabsContent>
				{isAdmin && (
					<TabsContent value="cuti-bulanan">
						<CutiBulananTab isSuperAdmin={!!isSuperAdmin} />
					</TabsContent>
				)}
				{isAdmin && (
					<TabsContent value="rekapitulasi">
						<RekapitulasiTab isSuperAdmin={!!isSuperAdmin} />
					</TabsContent>
				)}
				<TabsContent value="buku-cuti">
					<BukuCutiTab
						isAdmin={!!isAdmin}
						isPegawai={!!isPegawai}
						defaultPegawaiId={user?.pegawai_id}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// ============ Tab 1: Dashboard ============

function DashboardTab() {
	const currentYear = new Date().getFullYear();
	const [tahun, setTahun] = useState(currentYear);
	const { data, isLoading } = useLaporanDashboard(tahun);

	return (
		<div className="space-y-4">
			<Card className="border-dashed">
				<CardContent className="py-3">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-muted-foreground">
								Tahun
							</label>
							<Input
								type="number"
								value={tahun}
								onChange={(e) => setTahun(Number(e.target.value))}
								className="w-28"
								min={2020}
								max={2099}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-44" />
					))}
				</div>
			) : data && data.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{data.map((item) => (
						<DashboardPieCard key={item.jeniscuti_id} item={item} />
					))}
				</div>
			) : (
				<Card>
					<CardContent>
						<EmptyState
							message={`Tidak ada data laporan untuk tahun ${tahun}`}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function DonutChart({
	data,
	size = 130,
	strokeWidth = 22,
	centerLabel,
}: {
	data: { name: string; value: number; color: string }[];
	size?: number;
	strokeWidth?: number;
	centerLabel?: string;
}) {
	const segments = useMemo(() => {
		const total = data.reduce((sum, d) => sum + d.value, 0);
		if (total === 0) return [];
		const radius = (size - strokeWidth) / 2;
		const cx = size / 2;
		const cy = size / 2;
		const gap = data.length > 1 ? 0.03 : 0;
		let cumulative = 0;

		return data.map((d) => {
			const startFrac = cumulative / total;
			cumulative += d.value;
			const endFrac = cumulative / total;

			const startAngle = startFrac * Math.PI * 2 - Math.PI / 2 + gap;
			const endAngle = endFrac * Math.PI * 2 - Math.PI / 2 - gap;
			const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

			const x1 = cx + radius * Math.cos(startAngle);
			const y1 = cy + radius * Math.sin(startAngle);
			const x2 = cx + radius * Math.cos(endAngle);
			const y2 = cy + radius * Math.sin(endAngle);

			if (data.length === 1) {
				return {
					...d,
					path: `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`,
				};
			}

			return {
				...d,
				path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
			};
		});
	}, [data, size, strokeWidth]);

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			{segments.map((seg) => (
				<path
					key={seg.name}
					d={seg.path}
					fill="none"
					stroke={seg.color}
					strokeWidth={strokeWidth}
					strokeLinecap="butt"
				/>
			))}
			{centerLabel && (
				<text
					x={size / 2}
					y={size / 2}
					textAnchor="middle"
					dominantBaseline="central"
					className="fill-foreground text-lg font-bold"
				>
					{centerLabel}
				</text>
			)}
		</svg>
	);
}

function DashboardPieCard({ item }: { item: LaporanDashboardItem }) {
	const pieData = [
		{
			name: "Verifikasi",
			value: Number(item.verifikasi) || 0,
			color: STATUS_COLORS.Verifikasi,
		},
		{ name: "BTL", value: Number(item.btl) || 0, color: STATUS_COLORS.BTL },
		{
			name: "Ditolak",
			value: Number(item.ditolak) || 0,
			color: STATUS_COLORS.Ditolak,
		},
		{
			name: "Batal",
			value: Number(item.batal) || 0,
			color: STATUS_COLORS.Batal,
		},
		{
			name: "Proses",
			value: Number(item.proses) || 0,
			color: STATUS_COLORS.Proses,
		},
		{
			name: "Terima",
			value: Number(item.terima) || 0,
			color: STATUS_COLORS.Terima,
		},
	].filter((d) => d.value > 0);

	const total = pieData.reduce((sum, d) => sum + d.value, 0);

	return (
		<Card>
			<CardHeader className="pb-2 pt-4">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{item.jeniscuti_nama}
				</CardTitle>
				<div className="flex items-baseline gap-1.5">
					<span className="text-3xl font-bold">{item.total}</span>
					<span className="text-xs text-muted-foreground">pengajuan</span>
				</div>
			</CardHeader>
			<CardContent className="pb-4">
				{pieData.length > 0 ? (
					<div className="flex flex-col items-center gap-3">
						<DonutChart data={pieData} centerLabel={String(total)} />
						<div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
							{pieData.map((d) => (
								<div key={d.name} className="flex items-center gap-1.5 text-xs">
									<span
										className="inline-block h-2.5 w-2.5 rounded-full"
										style={{ backgroundColor: d.color }}
									/>
									<span className="text-muted-foreground">
										{d.name}{" "}
										<span className="font-medium text-foreground">
											{d.value}
										</span>
									</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground">
						<FileX className="h-7 w-7 opacity-30" />
						<span className="text-xs">Belum ada data status</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ============ Tab 2: Cuti Bulanan ============

function CutiBulananTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;
	const [tahun, setTahun] = useState(currentYear);
	const [bulan, setBulan] = useState(currentMonth);
	const [skpdId, setSkpdId] = useState<number | undefined>();

	const { data, isLoading } = useLaporanCutiBulanan({
		tahun,
		bulan,
		skpd_id: skpdId,
	});

	function handleExportCsv() {
		if (!data || data.length === 0) return;
		const headers = [
			"No",
			"NIP",
			"Nama",
			"Jabatan",
			"Jenis Cuti",
			"Tgl Awal",
			"Tgl Akhir",
			"Hari",
			"Status",
		];
		const rows = data.map((item, idx) => [
			String(idx + 1),
			item.pegawai_nip,
			formatNamaGelar(
				item.pegawai_nama,
				item.pegawai_gelardepan,
				item.pegawai_gelarbelakang,
			),
			item.jabatan_nama,
			item.jeniscuti_nama,
			item.usulcuti_tglawal,
			item.usulcuti_tglakhir,
			String(item.usulcuti_jumlah),
			item.usulcuti_status,
		]);
		const bulanLabel = BULAN_LABELS[String(bulan)] ?? String(bulan);
		exportToCsv(
			`laporan-cuti-bulanan-${tahun}-${bulanLabel.toLowerCase()}.csv`,
			headers,
			rows,
		);
	}

	function handleExportPdf() {
		const bulanLabel = BULAN_LABELS[String(bulan)] ?? String(bulan);
		printTable(
			`Laporan Cuti Bulanan - ${bulanLabel} ${tahun}`,
			"table-cuti-bulanan",
		);
	}

	return (
		<div className="space-y-4">
			<Card className="border-dashed">
				<CardContent className="py-3">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-muted-foreground">
								Tahun
							</label>
							<Input
								type="number"
								value={tahun}
								onChange={(e) => setTahun(Number(e.target.value))}
								className="w-28"
								min={2020}
								max={2099}
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-muted-foreground">
								Bulan
							</label>
							<Select
								value={String(bulan)}
								onValueChange={(v) => setBulan(Number(v))}
							>
								<SelectTrigger className="w-36">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{BULAN_OPTIONS.map((b) => (
										<SelectItem key={b.value} value={b.value}>
											{b.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{isSuperAdmin && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-muted-foreground">
									SKPD
								</label>
							<SkpdCombobox
								value={skpdId ? String(skpdId) : ""}
								onChange={(v) =>
									setSkpdId(v ? Number(v) : undefined)
								}
								showAll
								className="w-64"
							/>
							</div>
						)}
						<div className="ml-auto flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportCsv}
								disabled={!data || data.length === 0}
								className="gap-1.5"
							>
								<Download className="h-4 w-4" />
								Export Excel
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportPdf}
								disabled={!data || data.length === 0}
								className="gap-1.5"
							>
								<FileText className="h-4 w-4" />
								Export PDF
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-10" />
							))}
						</div>
					) : data && data.length > 0 ? (
						<Table id="table-cuti-bulanan" className="table-fixed w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="w-[5%]">No</TableHead>
									<TableHead className="w-[14%]">NIP</TableHead>
									<TableHead>Nama</TableHead>
									<TableHead>Jabatan</TableHead>
									<TableHead>Jenis Cuti</TableHead>
									<TableHead className="w-[14%]">Periode</TableHead>
									<TableHead className="w-[6%] text-center">Hari</TableHead>
									<TableHead className="w-[10%]">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((item, idx) => (
									<TableRow
										key={item.usulcuti_id}
										className={idx % 2 === 0 ? "bg-muted/30" : ""}
									>
										<TableCell>{idx + 1}</TableCell>
										<TableCell className="font-mono text-xs overflow-hidden text-ellipsis">
											{item.pegawai_nip}
										</TableCell>
										<TableCell className="whitespace-normal">
											{formatNamaGelar(
												item.pegawai_nama,
												item.pegawai_gelardepan,
												item.pegawai_gelarbelakang,
											)}
										</TableCell>
										<TableCell className="whitespace-normal">{item.jabatan_nama}</TableCell>
										<TableCell className="overflow-hidden text-ellipsis">{item.jeniscuti_nama}</TableCell>
										<TableCell className="text-xs overflow-hidden text-ellipsis">
											{formatDate(item.usulcuti_tglawal)} -{" "}
											{formatDate(item.usulcuti_tglakhir)}
										</TableCell>
										<TableCell className="text-center">
											{item.usulcuti_jumlah}
										</TableCell>
										<TableCell className="overflow-hidden">
											<Badge variant={getStatusVariant(item.usulcuti_status)}>
												{item.usulcuti_status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<EmptyState message="Tidak ada data cuti untuk periode ini" />
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ============ Tab 3: Rekapitulasi ============

function RekapitulasiTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
	const currentYear = new Date().getFullYear();
	const [tahun, setTahun] = useState(currentYear);
	const [skpdId, setSkpdId] = useState<number | undefined>();

	const { data, isLoading } = useLaporanRekapitulasi({
		tahun,
		skpd_id: skpdId,
	});

	const MONTH_KEYS = [
		"jan",
		"feb",
		"mar",
		"apr",
		"mei",
		"jun",
		"jul",
		"ags",
		"sep",
		"okt",
		"nov",
		"des",
	] as const;
	const MONTH_LABELS = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"Mei",
		"Jun",
		"Jul",
		"Ags",
		"Sep",
		"Okt",
		"Nov",
		"Des",
	];

	function handleExportCsv() {
		if (!data || data.length === 0) return;
		const headers = ["Jenis Cuti", ...MONTH_LABELS, "Total"];
		const rows = data.map((item) => [
			item.jeniscuti_nama,
			...MONTH_KEYS.map((k) => String(item[k] || 0)),
			String(item.total),
		]);
		exportToCsv(`rekapitulasi-cuti-${tahun}.csv`, headers, rows);
	}

	function handleExportPdf() {
		printTable(`Rekapitulasi Cuti Tahun ${tahun}`, "table-rekapitulasi");
	}

	return (
		<div className="space-y-4">
			<Card className="border-dashed">
				<CardContent className="py-3">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-muted-foreground">
								Tahun
							</label>
							<Input
								type="number"
								value={tahun}
								onChange={(e) => setTahun(Number(e.target.value))}
								className="w-28"
								min={2020}
								max={2099}
							/>
						</div>
						{isSuperAdmin && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-muted-foreground">
									SKPD
								</label>
							<SkpdCombobox
								value={skpdId ? String(skpdId) : ""}
								onChange={(v) =>
									setSkpdId(v ? Number(v) : undefined)
								}
								showAll
								className="w-64"
							/>
							</div>
						)}
						<div className="ml-auto flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportCsv}
								disabled={!data || data.length === 0}
								className="gap-1.5"
							>
								<Download className="h-4 w-4" />
								Export Excel
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportPdf}
								disabled={!data || data.length === 0}
								className="gap-1.5"
							>
								<FileText className="h-4 w-4" />
								Export PDF
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-10" />
							))}
						</div>
					) : data && data.length > 0 ? (
						<Table id="table-rekapitulasi">
							<TableHeader>
								<TableRow>
									<TableHead>Jenis Cuti</TableHead>
									{MONTH_LABELS.map((m) => (
										<TableHead key={m} className="text-center">
											{m}
										</TableHead>
									))}
									<TableHead className="text-center font-bold">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((item, idx) => (
									<TableRow
										key={item.jeniscuti_id}
										className={idx % 2 === 0 ? "bg-muted/30" : ""}
									>
										<TableCell className="font-medium">
											{item.jeniscuti_nama}
										</TableCell>
										{MONTH_KEYS.map((key) => (
											<TableCell key={key} className="text-center">
												{item[key] || 0}
											</TableCell>
										))}
										<TableCell className="text-center font-bold">
											{item.total}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<EmptyState
							message={`Tidak ada data rekapitulasi untuk tahun ${tahun}`}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ============ Tab 4: Buku Cuti ============

const createBalanceSchema = z.object({
	jeniscuti_id: z.string().min(1, "Pilih jenis cuti"),
	bukucuti_tglawal: z.string().min(1, "Tanggal awal wajib diisi"),
	bukucuti_tglakhir: z.string().min(1, "Tanggal akhir wajib diisi"),
	bukucuti_lama: z.string().min(1, "Jumlah hari wajib diisi"),
	bukucuti_tahun: z.string().min(4, "Tahun wajib diisi"),
});

const updateBalanceSchema = z.object({
	bukucuti_tglawal: z.string().optional(),
	bukucuti_tglakhir: z.string().optional(),
	bukucuti_lama: z.string().optional(),
});

type CreateBalanceForm = z.infer<typeof createBalanceSchema>;
type UpdateBalanceForm = z.infer<typeof updateBalanceSchema>;

function BukuCutiTab({
	isAdmin,
	isPegawai,
	defaultPegawaiId,
}: {
	isAdmin: boolean;
	isPegawai: boolean;
	defaultPegawaiId?: number;
}) {
	const currentYear = new Date().getFullYear();
	const [tahun, setTahun] = useState(currentYear);
	const [pegawaiId, setPegawaiId] = useState<number | undefined>(
		isPegawai ? defaultPegawaiId : undefined,
	);
	const [searchQuery, setSearchQuery] = useState("");

	const [createOpen, setCreateOpen] = useState(false);
	const [editEntry, setEditEntry] = useState<CutiBalanceEntry | null>(null);
	const [deleteEntry, setDeleteEntry] = useState<CutiBalanceEntry | null>(null);

	const { data: searchResults } = usePegawaiSearch(searchQuery);
	const { data: jenisCutiList } = useJenisCutiList();

	const { data: balanceEntries, isLoading: entriesLoading } =
		useCutiBalanceEntries(
			isAdmin ? pegawaiId : undefined,
			isAdmin ? tahun : undefined,
		);
	const { data: bukuData, isLoading: bukuLoading } = useBukuCuti(
		!isAdmin ? pegawaiId : undefined,
		!isAdmin ? tahun : undefined,
	);

	const createBalance = useCreateBalance();
	const deleteBalance = useDeleteBalance();

	const isLoading = isAdmin ? entriesLoading : bukuLoading;

	const createForm = useForm<CreateBalanceForm>({
		resolver: zodResolver(createBalanceSchema),
		defaultValues: {
			jeniscuti_id: "",
			bukucuti_tglawal: "",
			bukucuti_tglakhir: "",
			bukucuti_lama: "1",
			bukucuti_tahun: String(currentYear),
		},
	});

	function handleCreateSubmit(values: CreateBalanceForm) {
		if (!pegawaiId) return;
		createBalance.mutate(
			{
				pegawai_id: pegawaiId,
				jeniscuti_id: Number(values.jeniscuti_id),
				bukucuti_tglawal: values.bukucuti_tglawal,
				bukucuti_tglakhir: values.bukucuti_tglakhir,
				bukucuti_lama: Number(values.bukucuti_lama),
				bukucuti_tahun: Number(values.bukucuti_tahun),
			},
			{
				onSuccess: () => {
					setCreateOpen(false);
					createForm.reset({
						jeniscuti_id: "",
						bukucuti_tglawal: "",
						bukucuti_tglakhir: "",
						bukucuti_lama: "1",
						bukucuti_tahun: String(currentYear),
					});
				},
			},
		);
	}

	function handleDeleteConfirm() {
		if (!deleteEntry) return;
		deleteBalance.mutate(deleteEntry.bukucuti_id, {
			onSuccess: () => setDeleteEntry(null),
		});
	}

	return (
		<div className="space-y-4">
			<Card className="border-dashed">
				<CardContent className="py-3">
					<div className="flex flex-wrap items-center gap-4">
						{!isPegawai && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-muted-foreground">
									Pegawai
								</label>
								<div className="relative">
									<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari NIP atau nama..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-72 pl-9"
									/>
									{searchQuery.length >= 3 &&
										searchResults?.data &&
										searchResults.data.length > 0 && (
											<div className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg ring-1 ring-black/5">
												{searchResults.data.map((p) => (
													<button
														key={p.pegawai_id}
														type="button"
														className="flex w-full flex-col items-start rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
														onClick={() => {
															setPegawaiId(p.pegawai_id);
															setSearchQuery(
																formatNamaGelar(
																	p.pegawai_nama,
																	p.pegawai_gelardepan,
																	p.pegawai_gelarbelakang,
																),
															);
														}}
													>
														<span className="font-medium">
															{formatNamaGelar(
																p.pegawai_nama,
																p.pegawai_gelardepan,
																p.pegawai_gelarbelakang,
															)}
														</span>
														<span className="font-mono text-xs text-muted-foreground">
															{p.pegawai_nip}
														</span>
													</button>
												))}
											</div>
										)}
								</div>
							</div>
						)}
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-muted-foreground">
								Tahun
							</label>
							<Input
								type="number"
								value={tahun}
								onChange={(e) => setTahun(Number(e.target.value))}
								className="w-28"
								min={2020}
								max={2099}
							/>
						</div>
						{isAdmin && pegawaiId && (
							<div className="ml-auto">
								<Button
									size="sm"
									onClick={() => setCreateOpen(true)}
									className="gap-1.5"
								>
									<Plus className="h-4 w-4" />
									Tambah Entri
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					{!pegawaiId ? (
						<EmptyState
							message={
								isPegawai
									? "Data buku cuti tidak tersedia"
									: "Pilih pegawai untuk melihat buku cuti"
							}
						/>
					) : isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-10" />
							))}
						</div>
					) : isAdmin ? (
						balanceEntries && balanceEntries.length > 0 ? (
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow>
										<TableHead className="w-[5%]">No</TableHead>
										<TableHead>Jenis Cuti</TableHead>
										<TableHead className="w-[10%] text-center">Tahun</TableHead>
										<TableHead className="w-[12%]">Tgl Awal</TableHead>
										<TableHead className="w-[12%]">Tgl Akhir</TableHead>
										<TableHead className="w-[10%] text-center">Lama (Hari)</TableHead>
										<TableHead className="w-[12%]">Status</TableHead>
										<TableHead className="w-[10%] text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{balanceEntries.map((entry, idx) => (
										<TableRow
											key={entry.bukucuti_id}
											className={idx % 2 === 0 ? "bg-muted/30" : ""}
										>
											<TableCell>{idx + 1}</TableCell>
											<TableCell className="overflow-hidden text-ellipsis">{entry.jeniscuti_nama}</TableCell>
											<TableCell className="text-center">
												{entry.bukucuti_tahun}
											</TableCell>
											<TableCell className="text-xs overflow-hidden text-ellipsis">
												{entry.bukucuti_tglawal
													? formatDate(entry.bukucuti_tglawal)
													: "-"}
											</TableCell>
											<TableCell className="text-xs overflow-hidden text-ellipsis">
												{entry.bukucuti_tglakhir
													? formatDate(entry.bukucuti_tglakhir)
													: "-"}
											</TableCell>
											<TableCell className="text-center">
												{Number(entry.bukucuti_lama)}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{entry.bukucuti_status}</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
														onClick={() => setEditEntry(entry)}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-destructive hover:text-destructive"
														onClick={() => setDeleteEntry(entry)}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<EmptyState message="Tidak ada data buku cuti" />
						)
					) : bukuData && bukuData.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">No</TableHead>
									<TableHead>Jenis Cuti</TableHead>
									<TableHead className="text-center">Tahun</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{bukuData.map((item, idx) => (
									<TableRow
										key={item.bukucuti_id}
										className={idx % 2 === 0 ? "bg-muted/30" : ""}
									>
										<TableCell>{idx + 1}</TableCell>
										<TableCell>{item.jeniscuti_nama}</TableCell>
										<TableCell className="text-center">
											{item.bukucuti_tahun}
										</TableCell>
										<TableCell>
											<Badge variant="outline">{item.bukucuti_status}</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<EmptyState message="Tidak ada data buku cuti" />
					)}
				</CardContent>
			</Card>

			{/* Create Balance Dialog */}
			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Tambah Entri Buku Cuti</DialogTitle>
					</DialogHeader>
					<Form {...createForm}>
						<form
							onSubmit={createForm.handleSubmit(handleCreateSubmit)}
							className="space-y-4 min-w-0"
						>
							<FormField
								control={createForm.control}
								name="jeniscuti_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Jenis Cuti</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value ?? ""}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Pilih jenis cuti" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{jenisCutiList?.map((jc) => (
													<SelectItem
														key={jc.jeniscuti_id}
														value={String(jc.jeniscuti_id)}
													>
														{jc.jeniscuti_nama}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={createForm.control}
									name="bukucuti_tglawal"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tanggal Awal</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={createForm.control}
									name="bukucuti_tglakhir"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tanggal Akhir</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={createForm.control}
									name="bukucuti_lama"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Jumlah Hari</FormLabel>
											<FormControl>
												<Input type="number" min={1} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={createForm.control}
									name="bukucuti_tahun"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tahun</FormLabel>
											<FormControl>
												<Input type="number" min={2020} max={2099} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setCreateOpen(false)}
								>
									Batal
								</Button>
								<Button type="submit" disabled={createBalance.isPending}>
									{createBalance.isPending ? "Menyimpan..." : "Simpan"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Edit Balance Dialog */}
			{editEntry && (
				<EditBalanceDialog
					entry={editEntry}
					onClose={() => setEditEntry(null)}
				/>
			)}

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteEntry}
				onOpenChange={(open) => {
					if (!open) setDeleteEntry(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Entri Buku Cuti</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus entri{" "}
							<strong>{deleteEntry?.jeniscuti_nama}</strong> tahun{" "}
							<strong>{deleteEntry?.bukucuti_tahun}</strong>? Tindakan ini tidak
							dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function EditBalanceDialog({
	entry,
	onClose,
}: {
	entry: CutiBalanceEntry;
	onClose: () => void;
}) {
	const updateBalance = useUpdateBalance(entry.bukucuti_id);

	const form = useForm<UpdateBalanceForm>({
		resolver: zodResolver(updateBalanceSchema),
		defaultValues: {
			bukucuti_tglawal: entry.bukucuti_tglawal ?? "",
			bukucuti_tglakhir: entry.bukucuti_tglakhir ?? "",
			bukucuti_lama: String(entry.bukucuti_lama ?? ""),
		},
	});

	function handleSubmit(values: UpdateBalanceForm) {
		updateBalance.mutate(
			{
				bukucuti_tglawal: values.bukucuti_tglawal || undefined,
				bukucuti_tglakhir: values.bukucuti_tglakhir || undefined,
				bukucuti_lama: values.bukucuti_lama
					? Number(values.bukucuti_lama)
					: undefined,
			},
			{
				onSuccess: () => onClose(),
			},
		);
	}

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Entri Buku Cuti</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground -mt-2">
					<span className="font-medium text-foreground">
						{entry.jeniscuti_nama}
					</span>{" "}
					&mdash; Tahun {entry.bukucuti_tahun}
				</p>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="bukucuti_tglawal"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tanggal Awal</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="bukucuti_tglakhir"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tanggal Akhir</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="bukucuti_lama"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Jumlah Hari</FormLabel>
									<FormControl>
										<Input type="number" min={1} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								Batal
							</Button>
							<Button type="submit" disabled={updateBalance.isPending}>
								{updateBalance.isPending ? "Menyimpan..." : "Simpan"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

// ============ Helpers ============

function formatDate(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString("id-ID", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}
