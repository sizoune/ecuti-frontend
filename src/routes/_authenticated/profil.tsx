import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { usePegawaiProfile, useUpdateProfile } from '#/hooks/use-pegawai'
import { useAuth } from '#/lib/auth'
import { formatNamaGelar } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'

export const Route = createFileRoute('/_authenticated/profil')({
  component: ProfilPage,
})

const profileSchema = z.object({
  pegawai_email: z.string().email('Email tidak valid').or(z.literal('')),
  pegawai_nohp: z.string(),
})

type ProfileForm = z.infer<typeof profileSchema>

function ProfilPage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = usePegawaiProfile()
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      pegawai_email: profile?.pegawai_email ?? '',
      pegawai_nohp: profile?.pegawai_nohp ?? '',
    },
  })

  const onSubmit = async (values: ProfileForm) => {
    try {
      await updateProfile.mutateAsync(values)
      toast.success('Profil berhasil diperbarui')
    } catch {
      toast.error('Gagal memperbarui profil')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profil</h2>
        <p className="text-muted-foreground">Informasi data diri Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pegawai</CardTitle>
          <CardDescription>Informasi ini dikelola oleh administrator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="NIP" value={profile?.pegawai_nip ?? user?.pegawai_nip ?? '-'} />
          <InfoRow label="Nama" value={formatNamaGelar(profile?.pegawai_nama ?? user?.pegawai_nama ?? '-', profile?.pegawai_gelardepan, profile?.pegawai_gelarbelakang)} />
          <InfoRow label="SKPD" value={profile?.skpd_nama ?? '-'} />
          <InfoRow label="Unit Kerja" value={profile?.subunit_nama ?? '-'} />
          <InfoRow label="Golongan" value={profile?.golongan_nama ?? '-'} />
          <InfoRow label="Jabatan" value={profile?.jabatan_nama ?? '-'} />
          <InfoRow label="Status" value={profile?.pegawai_kedudukanpns ?? '-'} />
          <InfoRow label="Role" value={user?.role ?? '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontak</CardTitle>
          <CardDescription>Anda dapat memperbarui email dan nomor HP</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="pegawai_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
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
                    <FormLabel>Nomor HP</FormLabel>
                    <FormControl>
                      <Input placeholder="08xxxxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="min-w-[120px] text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
