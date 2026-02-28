import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
	ArrowLeft,
	Award,
	Briefcase,
	Building2,
	ChevronDown,
	IdCard,
	Mail,
	Phone,
	Shield,
	User,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { useCutiBalance } from "#/hooks/use-cuti";
import { usePegawaiDetail } from "#/hooks/use-pegawai";
import { formatNamaGelar } from "#/lib/utils";

export const Route = createFileRoute("/_authenticated/pegawai/$id")({
	beforeLoad: () => {
		const stored = localStorage.getItem("user");
		if (!stored) {
			throw redirect({ to: "/" });
		}
		try {
			const user = JSON.parse(stored);
			if (user.role === "Pegawai") {
				throw redirect({ to: "/" });
			}
		} catch {
			throw redirect({ to: "/" });
		}
	},
	component: PegawaiDetail,
});

function getInitials(name: string | undefined): string {
	if (!name) return "?";
	const parts = name.trim().split(" ");
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getStatusBadge(status: string | undefined) {
	if (!status) return <span className="text-muted-foreground">-</span>;
	const lower = status.toLowerCase();
	if (lower.includes("aktif") && !lower.includes("tidak")) {
		return (
			<Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
				{status}
			</Badge>
		);
	}
	if (
		lower.includes("tidak aktif") ||
		lower.includes("pensiun") ||
		lower.includes("purnabakti")
	) {
		return (
			<Badge variant="secondary" className="bg-gray-100 text-gray-700">
				{status}
			</Badge>
		);
	}
	return <Badge variant="outline">{status}</Badge>;
}

function InfoRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
			<div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground">
				{icon}
			</div>
			<span className="min-w-[120px] text-sm font-medium text-muted-foreground">
				{label}
			</span>
			<span className="text-sm font-medium">{value}</span>
		</div>
	);
}

function PegawaiDetail() {
	const { id } = Route.useParams();
	const pegawaiId = Number(id);
	const currentYear = new Date().getFullYear();
	const [tahun, setTahun] = useState(currentYear);

	const { data: pegawai, isLoading } = usePegawaiDetail(pegawaiId);
	const { data: balance, isLoading: balanceLoading } = useCutiBalance(
		pegawaiId,
		tahun,
	);

	const displayName = formatNamaGelar(
		pegawai?.pegawai_nama ?? "-",
		pegawai?.pegawai_gelardepan ?? undefined,
		pegawai?.pegawai_gelarbelakang ?? undefined,
	);

	const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (!pegawai) {
		return (
			<div className="space-y-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/pegawai">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Kembali
					</Link>
				</Button>
				<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
					<Users className="h-10 w-10 opacity-30" />
					<p className="text-sm font-medium">Data pegawai tidak ditemukan</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/pegawai">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Kembali
					</Link>
				</Button>
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Detail Pegawai</h2>
					<p className="text-muted-foreground text-sm">
						Informasi lengkap data pegawai
					</p>
				</div>
			</div>

			{/* Avatar / Hero card */}
			<Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
				<CardContent className="pt-6 pb-6">
					<div className="flex items-center gap-5">
						<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-md">
							{getInitials(pegawai.pegawai_nama)}
						</div>
						<div className="min-w-0">
							<p className="text-xl font-bold leading-tight truncate">
								{displayName}
							</p>
							<p className="text-sm text-muted-foreground mt-0.5 font-mono">
								{pegawai.pegawai_nip}
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{getStatusBadge(pegawai.pegawai_kedudukanpns)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Data Pegawai */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-4 w-4 text-primary" />
						Data Pegawai
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="divide-y">
						<InfoRow
							icon={<IdCard className="h-3.5 w-3.5" />}
							label="NIP"
							value={<span className="font-mono">{pegawai.pegawai_nip}</span>}
						/>
						<InfoRow
							icon={<User className="h-3.5 w-3.5" />}
							label="Nama"
							value={displayName}
						/>
						<InfoRow
							icon={<Building2 className="h-3.5 w-3.5" />}
							label="SKPD"
							value={pegawai.skpd_nama ?? "-"}
						/>
						<InfoRow
							icon={<Users className="h-3.5 w-3.5" />}
							label="Sub Unit"
							value={pegawai.subunit_nama ?? "-"}
						/>
						<InfoRow
							icon={<Award className="h-3.5 w-3.5" />}
							label="Golongan"
							value={pegawai.golongan_nama ?? "-"}
						/>
						<InfoRow
							icon={<Briefcase className="h-3.5 w-3.5" />}
							label="Jabatan"
							value={pegawai.jabatan_nama ?? "-"}
						/>
						<InfoRow
							icon={<ChevronDown className="h-3.5 w-3.5" />}
							label="Eselon"
							value={pegawai.eselon_nama ?? "-"}
						/>
						<InfoRow
							icon={<Shield className="h-3.5 w-3.5" />}
							label="Kedudukan PNS"
							value={getStatusBadge(pegawai.pegawai_kedudukanpns)}
						/>
						{pegawai.pegawai_email && (
							<InfoRow
								icon={<Mail className="h-3.5 w-3.5" />}
								label="Email"
								value={pegawai.pegawai_email}
							/>
						)}
						{pegawai.pegawai_nohp && (
							<InfoRow
								icon={<Phone className="h-3.5 w-3.5" />}
								label="No HP"
								value={pegawai.pegawai_nohp}
							/>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Leave Balance */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Award className="h-4 w-4 text-primary" />
							Saldo Cuti
						</CardTitle>
						<Select
							value={String(tahun)}
							onValueChange={(v) => setTahun(Number(v))}
						>
							<SelectTrigger className="w-[120px] h-8 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{yearOptions.map((y) => (
									<SelectItem key={y} value={String(y)}>
										{y}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent>
					{balanceLoading ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-20 w-full rounded-lg" />
							))}
						</div>
					) : balance && balance.length > 0 ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{balance.map((b) => (
								<div
									key={b.jeniscuti_id}
									className="rounded-lg border bg-muted/30 p-4 text-center"
								>
									<p className="text-xs text-muted-foreground leading-tight mb-1">
										{b.jeniscuti_nama}
									</p>
									<p className="text-2xl font-bold text-primary">
										{b.terpakai}
									</p>
									<p className="text-xs text-muted-foreground">hari terpakai</p>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
							<Award className="h-8 w-8 opacity-30" />
							<p className="text-sm">
								Tidak ada data saldo cuti untuk tahun {tahun}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
