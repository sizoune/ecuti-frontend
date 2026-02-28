import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
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
import { useSkpdList } from "#/hooks/use-master";
import { usePegawaiList } from "#/hooks/use-pegawai";

export const Route = createFileRoute("/_authenticated/pegawai/")({
	beforeLoad: () => {
		const stored = localStorage.getItem("user");
		if (!stored) {
			throw redirect({ to: "/" });
		}
		try {
			const user = JSON.parse(stored);
			if (!["Super Admin", "Admin SKPD", "Admin Uker"].includes(user.role)) {
				throw redirect({ to: "/" });
			}
		} catch {
			throw redirect({ to: "/" });
		}
	},
	component: PegawaiListPage,
});

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

function PegawaiListPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [skpdId, setSkpdId] = useState<string>("");

	const { data, isLoading } = usePegawaiList({
		page,
		limit: 10,
		search: search || undefined,
		skpd_id: skpdId && skpdId !== "all" ? Number(skpdId) : undefined,
	});
	const { data: skpdList } = useSkpdList();

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Data Pegawai</h2>
				<p className="text-muted-foreground">Daftar pegawai dalam sistem</p>
			</div>

			<Card>
				{/* Clean toolbar — no CardTitle "Filter" label */}
				<div className="flex flex-wrap items-center gap-3 border-b px-6 py-3">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Cari nama atau NIP..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9 h-9"
						/>
					</div>
					<Select
						value={skpdId}
						onValueChange={(v) => {
							setSkpdId(v);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-[240px] h-9">
							<SelectValue placeholder="Semua SKPD" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua SKPD</SelectItem>
							{skpdList?.map((s) => (
								<SelectItem key={s.skpd_id} value={String(s.skpd_id)}>
									{s.skpd_nama}
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
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead>NIP</TableHead>
										<TableHead>Nama</TableHead>
										<TableHead>SKPD</TableHead>
										<TableHead>Golongan</TableHead>
										<TableHead>Jabatan</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.data && data.data.length > 0 ? (
										data.data.map((p) => (
											<TableRow
												key={p.pegawai_id}
												className="hover:bg-muted/40 transition-colors"
											>
												<TableCell className="font-mono text-sm">
													{p.pegawai_nip}
												</TableCell>
												<TableCell className="font-medium">
													<Link
														to="/pegawai/$id"
														params={{ id: String(p.pegawai_id) }}
														className="hover:underline text-primary"
													>
														{p.pegawai_nama}
													</Link>
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{p.skpd_nama ?? "-"}
												</TableCell>
												<TableCell className="text-sm">
													{p.golongan_nama ?? "-"}
												</TableCell>
												<TableCell className="text-sm">
													{p.jabatan_nama ?? "-"}
												</TableCell>
												<TableCell>
													{getStatusBadge(p.pegawai_kedudukanpns)}
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={6} className="py-16 text-center">
												<div className="flex flex-col items-center gap-3 text-muted-foreground">
													<Users className="h-10 w-10 opacity-30" />
													<div>
														<p className="font-medium text-sm">
															Tidak ada pegawai ditemukan
														</p>
														<p className="text-xs mt-1">
															{search
																? `Tidak ada hasil untuk "${search}"`
																: "Belum ada data pegawai dalam sistem"}
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
										{(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} dari{" "}
										{data.total} pegawai
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
