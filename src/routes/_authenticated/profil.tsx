import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import {
	Award,
	Briefcase,
	Building2,
	IdCard,
	Loader2,
	Mail,
	Phone,
	Shield,
	User,
	Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { usePegawaiProfile, useUpdateProfile } from "#/hooks/use-pegawai";
import { useAuth } from "#/lib/auth";
import { formatNamaGelar } from "#/lib/utils";

export const Route = createFileRoute("/_authenticated/profil")({
	component: ProfilPage,
});

const profileSchema = z.object({
	pegawai_email: z.string().email("Email tidak valid").or(z.literal("")),
	pegawai_nohp: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function getRoleColor(role: string | undefined) {
	switch (role) {
		case "Super Admin":
			return "destructive";
		case "Admin SKPD":
			return "default";
		case "Admin Uker":
			return "secondary";
		default:
			return "outline";
	}
}

function getInitials(name: string | undefined): string {
	if (!name) return "?";
	const parts = name.trim().split(" ");
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function ProfilPage() {
	const { user } = useAuth();
	const { data: profile, isLoading } = usePegawaiProfile();
	const updateProfile = useUpdateProfile();

	const form = useForm<ProfileForm>({
		resolver: zodResolver(profileSchema),
		values: {
			pegawai_email: profile?.pegawai_email ?? "",
			pegawai_nohp: profile?.pegawai_nohp ?? "",
		},
	});

	const onSubmit = async (values: ProfileForm) => {
		try {
			await updateProfile.mutateAsync(values);
			toast.success("Profil berhasil diperbarui");
		} catch {
			toast.error("Gagal memperbarui profil");
		}
	};

	const displayName = formatNamaGelar(
		profile?.pegawai_nama ?? user?.pegawai_nama ?? "-",
		profile?.pegawai_gelardepan,
		profile?.pegawai_gelarbelakang,
	);

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl space-y-4">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-40 w-full rounded-xl" />
				<Skeleton className="h-[300px]" />
				<Skeleton className="h-[200px]" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Profil</h2>
				<p className="text-muted-foreground">Informasi data diri Anda</p>
			</div>

			{/* Avatar / Hero card */}
			<Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
				<CardContent className="pt-6 pb-6">
					<div className="flex items-center gap-5">
						<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-md">
							{getInitials(profile?.pegawai_nama ?? user?.pegawai_nama)}
						</div>
						<div className="min-w-0">
							<p className="text-xl font-bold leading-tight truncate">
								{displayName}
							</p>
							<p className="text-sm text-muted-foreground mt-0.5 font-mono">
								{profile?.pegawai_nip ?? user?.pegawai_nip ?? "-"}
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								<Badge
									variant={
										getRoleColor(user?.role) as
											| "default"
											| "secondary"
											| "outline"
											| "destructive"
									}
								>
									{user?.role ?? "Pegawai"}
								</Badge>
								{profile?.pegawai_kedudukanpns && (
									<Badge variant="outline" className="text-xs">
										{profile.pegawai_kedudukanpns}
									</Badge>
								)}
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
					<CardDescription>
						Informasi ini dikelola oleh administrator
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<div className="divide-y">
						<InfoRow
							icon={<IdCard className="h-3.5 w-3.5" />}
							label="NIP"
							value={profile?.pegawai_nip ?? user?.pegawai_nip ?? "-"}
						/>
						<InfoRow
							icon={<User className="h-3.5 w-3.5" />}
							label="Nama"
							value={displayName}
						/>
						<InfoRow
							icon={<Building2 className="h-3.5 w-3.5" />}
							label="SKPD"
							value={profile?.skpd_nama ?? "-"}
						/>
						<InfoRow
							icon={<Users className="h-3.5 w-3.5" />}
							label="Unit Kerja"
							value={profile?.subunit_nama ?? "-"}
						/>
						<InfoRow
							icon={<Award className="h-3.5 w-3.5" />}
							label="Golongan"
							value={profile?.golongan_nama ?? "-"}
						/>
						<InfoRow
							icon={<Briefcase className="h-3.5 w-3.5" />}
							label="Jabatan"
							value={profile?.jabatan_nama ?? "-"}
						/>
						<InfoRow
							icon={<Shield className="h-3.5 w-3.5" />}
							label="Status"
							value={profile?.pegawai_kedudukanpns ?? "-"}
						/>
						<InfoRow
							icon={<Shield className="h-3.5 w-3.5" />}
							label="Role Sistem"
							value={user?.role ?? "-"}
							isLast
						/>
					</div>
				</CardContent>
			</Card>

			{/* Divider with label */}
			<div className="relative">
				<Separator />
				<span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
					Informasi yang dapat diedit
				</span>
			</div>

			{/* Kontak */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-primary" />
						Kontak
					</CardTitle>
					<CardDescription>
						Anda dapat memperbarui email dan nomor HP
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="pegawai_email"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1.5">
											<Mail className="h-3.5 w-3.5" />
											Email
										</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="email@example.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="pegawai_nohp"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center gap-1.5">
											<Phone className="h-3.5 w-3.5" />
											Nomor HP
										</FormLabel>
										<FormControl>
											<Input placeholder="08xxxxxxxxxx" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Separator />
							<Button type="submit" disabled={updateProfile.isPending}>
								{updateProfile.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Simpan Perubahan
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

function InfoRow({
	icon,
	label,
	value,
	isLast,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	isLast?: boolean;
}) {
	return (
		<div
			className={`flex items-start gap-3 px-6 py-3 ${isLast ? "" : ""} hover:bg-muted/30 transition-colors`}
		>
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
