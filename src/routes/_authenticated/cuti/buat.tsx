import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	CalendarDays,
	Check,
	ChevronsUpDown,
	FileText,
	Loader2,
	MapPin,
	Paperclip,
	Users,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/ui/command";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useCreateCuti } from "#/hooks/use-cuti";
import { useJenisCutiList } from "#/hooks/use-master";
import { usePegawaiSearch } from "#/hooks/use-pegawai";
import api from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { cn, formatNamaGelar } from "#/lib/utils";
import type { Pegawai } from "#/types";

export const Route = createFileRoute("/_authenticated/cuti/buat")({
	component: BuatCutiPage,
});

const cutiSchema = z.object({
	jeniscuti_id: z.string().min(1, "Jenis cuti wajib dipilih"),
	usulcuti_tglawal: z.string().min(1, "Tanggal mulai wajib diisi"),
	usulcuti_tglakhir: z.string().min(1, "Tanggal selesai wajib diisi"),
	usulcuti_jumlah: z.string(),
	usulcuti_alasan: z.string().min(1, "Alasan cuti wajib diisi"),
	usulcuti_alamat: z.string().min(1, "Alamat selama cuti wajib diisi"),
	usulcuti_lokasi: z.string().min(1, "Lokasi wajib dipilih"),
	atasanlangsung_id: z.string().min(1, "Atasan langsung wajib dipilih"),
	pejabat_id: z.string().min(1, "Pejabat wajib dipilih"),
});

type CutiForm = z.infer<typeof cutiSchema>;

function SectionHeader({
	icon: Icon,
	title,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
}) {
	return (
		<div className="flex items-center gap-2 border-b pb-3">
			<div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
				<Icon className="h-4 w-4 text-primary" />
			</div>
			<span className="text-sm font-semibold">{title}</span>
		</div>
	);
}

function PegawaiCombobox({
	value,
	onChange,
	excludeId,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	excludeId?: number;
	placeholder: string;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selected, setSelected] = useState<Pegawai | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const { data: result, isLoading } = usePegawaiSearch(debouncedSearch);
	const pegawaiList =
		result?.data?.filter((p) => p.pegawai_id !== excludeId) ?? [];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					<span className="truncate">
						{selected
							? `${selected.pegawai_nip} / ${formatNamaGelar(selected.pegawai_nama, selected.pegawai_gelardepan, selected.pegawai_gelarbelakang)}`
							: placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[--radix-popover-trigger-width] p-0"
				align="start"
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Ketik NIP atau nama (min 3 huruf)..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						{debouncedSearch.length < 3 ? (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Ketik minimal 3 karakter untuk mencari
							</div>
						) : isLoading ? (
							<div className="flex items-center justify-center py-6">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						) : (
							<>
								<CommandEmpty>Pegawai tidak ditemukan</CommandEmpty>
								<CommandGroup>
									{pegawaiList.map((p) => (
										<CommandItem
											key={p.pegawai_id}
											value={String(p.pegawai_id)}
											onSelect={() => {
												onChange(String(p.pegawai_id));
												setSelected(p);
												setOpen(false);
											}}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													value === String(p.pegawai_id)
														? "opacity-100"
														: "opacity-0",
												)}
											/>
											<div className="flex flex-col">
												<span className="text-sm">
													{p.pegawai_nip} /{" "}
													{formatNamaGelar(
														p.pegawai_nama,
														p.pegawai_gelardepan,
														p.pegawai_gelarbelakang,
													)}
												</span>
												{p.jabatan_nama && (
													<span className="text-xs text-muted-foreground">
														{p.jabatan_nama}
													</span>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function BuatCutiPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const createCuti = useCreateCuti();
	const { data: jenisCuti } = useJenisCutiList();
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [uploadingFile, setUploadingFile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;
		setFileError(null);
		if (!file) {
			setPendingFile(null);
			return;
		}
		if (file.type !== "application/pdf") {
			setFileError("File harus berformat PDF");
			setPendingFile(null);
			e.target.value = "";
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			setFileError("Ukuran file tidak boleh lebih dari 2 MB");
			setPendingFile(null);
			e.target.value = "";
			return;
		}
		setPendingFile(file);
	};

	const form = useForm<CutiForm>({
		resolver: zodResolver(cutiSchema),
		defaultValues: {
			jeniscuti_id: "",
			usulcuti_tglawal: "",
			usulcuti_tglakhir: "",
			usulcuti_jumlah: "0",
			usulcuti_alasan: "",
			usulcuti_alamat: "",
			usulcuti_lokasi: "Dalam Negeri",
			atasanlangsung_id: "",
			pejabat_id: "",
		},
	});

	const tglAwal = form.watch("usulcuti_tglawal");
	const tglAkhir = form.watch("usulcuti_tglakhir");

	// Auto-calculate days
	if (tglAwal && tglAkhir) {
		const start = new Date(tglAwal);
		const end = new Date(tglAkhir);
		const diff =
			Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		if (diff > 0 && String(diff) !== form.getValues("usulcuti_jumlah")) {
			form.setValue("usulcuti_jumlah", String(diff));
		}
	}

	const onSubmit = async (values: CutiForm) => {
		try {
			const result = await createCuti.mutateAsync({
				jeniscuti_id: Number(values.jeniscuti_id),
				usulcuti_tglawal: values.usulcuti_tglawal,
				usulcuti_tglakhir: values.usulcuti_tglakhir,
				usulcuti_jumlah: Number(values.usulcuti_jumlah),
				usulcuti_alasan: values.usulcuti_alasan,
				usulcuti_alamat: values.usulcuti_alamat,
				usulcuti_lokasi: values.usulcuti_lokasi as
					| "Dalam Negeri"
					| "Luar Negeri",
				atasanlangsung_id: Number(values.atasanlangsung_id),
				pejabat_id: Number(values.pejabat_id),
			});

			// Upload file pengantar if provided
			if (pendingFile && result.usulcuti_id) {
				setUploadingFile(true);
				try {
					const formData = new FormData();
					formData.append("file", pendingFile);
					await api.post(
						`/cuti/${result.usulcuti_id}/file-pengantar`,
						formData,
						{
							headers: { "Content-Type": "multipart/form-data" },
						},
					);
				} catch {
					setUploadingFile(false);
					toast.warning(
						"Pengajuan berhasil dibuat, namun gagal mengunggah file pengantar",
					);
					navigate({ to: "/cuti" });
					return;
				}
				setUploadingFile(false);
			}

			toast.success("Pengajuan cuti berhasil dibuat");
			navigate({ to: "/cuti" });
		} catch (error: unknown) {
			const err = error as {
				response?: { data?: { message?: string | string[] } };
			};
			const message =
				err?.response?.data?.message || "Gagal membuat pengajuan cuti";
			toast.error(Array.isArray(message) ? message[0] : message);
		}
	};

	return (
		<div className="mx-auto max-w-2xl space-y-5">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Ajukan Cuti</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Isi formulir berikut untuk membuat pengajuan cuti baru
				</p>
			</div>

			<Card>
				<CardHeader className="border-b pb-4">
					<CardTitle className="text-base">Formulir Pengajuan Cuti</CardTitle>
					<p className="text-sm text-muted-foreground">
						Lengkapi semua kolom yang ditandai wajib diisi
					</p>
				</CardHeader>

				<CardContent className="pt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							{/* Section 1: Jenis Cuti */}
							<div className="space-y-4">
								<SectionHeader icon={BookOpen} title="Jenis Cuti" />
								<FormField
									control={form.control}
									name="jeniscuti_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Jenis Cuti</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Pilih jenis cuti" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{jenisCuti?.map((jc) => (
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
							</div>

							{/* Section 2: Periode */}
							<div className="space-y-4">
								<SectionHeader icon={CalendarDays} title="Periode Cuti" />
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="usulcuti_tglawal"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tanggal Mulai</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="usulcuti_tglakhir"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tanggal Selesai</FormLabel>
												<FormControl>
													<Input type="date" min={tglAwal} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="usulcuti_jumlah"
									render={({ field }) => (
										<FormItem className="max-w-[160px]">
											<FormLabel>Jumlah Hari</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														type="number"
														min={1}
														readOnly
														{...field}
														className="pr-12 bg-muted/50 text-center font-medium"
													/>
													<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
														hari
													</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Section 3: Detail */}
							<div className="space-y-4">
								<SectionHeader icon={FileText} title="Detail Cuti" />
								<FormField
									control={form.control}
									name="usulcuti_alasan"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Alasan Cuti</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Tuliskan alasan cuti Anda secara singkat dan jelas"
													className="min-h-[90px] resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="usulcuti_alamat"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Alamat Selama Cuti</FormLabel>
											<FormControl>
												<Input
													placeholder="Alamat lengkap selama cuti berlangsung"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="usulcuti_lokasi"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Lokasi</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={field.onChange}
													defaultValue={field.value}
													className="flex gap-6"
												>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="Dalam Negeri"
															id="dalam-negeri"
														/>
														<Label
															htmlFor="dalam-negeri"
															className="cursor-pointer"
														>
															<MapPin className="mr-1 inline h-3.5 w-3.5" />
															Dalam Negeri
														</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem
															value="Luar Negeri"
															id="luar-negeri"
														/>
														<Label
															htmlFor="luar-negeri"
															className="cursor-pointer"
														>
															<MapPin className="mr-1 inline h-3.5 w-3.5" />
															Luar Negeri
														</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Section 4: Persetujuan */}
							<div className="space-y-4">
								<SectionHeader icon={Users} title="Pejabat Persetujuan" />
								<FormField
									control={form.control}
									name="atasanlangsung_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Atasan Langsung</FormLabel>
											<FormControl>
												<PegawaiCombobox
													value={field.value}
													onChange={field.onChange}
													excludeId={user?.pegawai_id}
													placeholder="Cari dan pilih atasan langsung"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="pejabat_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pejabat Yang Berwenang</FormLabel>
											<FormControl>
												<PegawaiCombobox
													value={field.value}
													onChange={field.onChange}
													excludeId={user?.pegawai_id}
													placeholder="Cari dan pilih pejabat berwenang"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Section 5: File Pengantar (optional) */}
							<div className="space-y-4">
								<SectionHeader
									icon={Paperclip}
									title="File Pengantar (Opsional)"
								/>
								<div className="space-y-2">
									<p className="text-xs text-muted-foreground">
										Unggah surat pengantar dalam format PDF, maksimal 2 MB.
										Kolom ini tidak wajib diisi.
									</p>
									<div className="flex items-center gap-3">
										<input
											ref={fileInputRef}
											type="file"
											accept=".pdf,application/pdf"
											className="hidden"
											onChange={handleFileChange}
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => fileInputRef.current?.click()}
										>
											<Paperclip className="mr-2 h-3.5 w-3.5" />
											Pilih File PDF
										</Button>
										{pendingFile && (
											<div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
												<FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
												<span className="max-w-[200px] truncate">
													{pendingFile.name}
												</span>
												<span className="text-xs text-muted-foreground">
													({(pendingFile.size / 1024).toFixed(0)} KB)
												</span>
												<button
													type="button"
													onClick={() => {
														setPendingFile(null);
														setFileError(null);
														if (fileInputRef.current)
															fileInputRef.current.value = "";
													}}
													className="ml-1 text-muted-foreground hover:text-destructive"
												>
													<X className="h-3.5 w-3.5" />
												</button>
											</div>
										)}
									</div>
									{fileError && (
										<p className="text-sm font-medium text-destructive">
											{fileError}
										</p>
									)}
								</div>
							</div>

							{/* Actions */}
							<div className="flex items-center gap-3 border-t pt-4">
								<Button
									type="submit"
									disabled={createCuti.isPending || uploadingFile}
									className="min-w-[120px]"
								>
									{(createCuti.isPending || uploadingFile) && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Ajukan Cuti
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => navigate({ to: "/cuti" })}
								>
									Batal
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
