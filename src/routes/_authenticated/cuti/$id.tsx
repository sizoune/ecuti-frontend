import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCutiDetail, useUpdateCutiStatus, useCancelCuti } from '#/hooks/use-cuti'
import { useAuth } from '#/lib/auth'
import type { CutiStatus } from '#/types'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'
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
} from '#/components/ui/alert-dialog'

export const Route = createFileRoute('/_authenticated/cuti/$id')({
  component: CutiDetailPage,
})

const statusColors: Record<CutiStatus, string> = {
  Verifikasi: 'bg-yellow-100 text-yellow-800',
  Proses: 'bg-blue-100 text-blue-800',
  Terima: 'bg-green-100 text-green-800',
  Ditolak: 'bg-red-100 text-red-800',
  Batal: 'bg-gray-100 text-gray-800',
  BTL: 'bg-orange-100 text-orange-800',
}

function CutiDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: cuti, isLoading } = useCutiDetail(Number(id))
  const updateStatus = useUpdateCutiStatus(Number(id))
  const cancelCuti = useCancelCuti(Number(id))

  const isAdmin = user && user.role !== 'Pegawai'
  const isOwner = cuti && cuti.pegawai_id === user?.pegawai_id
  const canCancel = isOwner && cuti?.usulcuti_status === 'Verifikasi'
  const canVerify = isAdmin && cuti?.usulcuti_status === 'Verifikasi'

  const handleStatusUpdate = async (status: CutiStatus) => {
    try {
      await updateStatus.mutateAsync({ usulcuti_status: status })
      toast.success(`Cuti berhasil ${status === 'Terima' ? 'disetujui' : status === 'Ditolak' ? 'ditolak' : 'diperbarui'}`)
    } catch {
      toast.error('Gagal memperbarui status cuti')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelCuti.mutateAsync()
      toast.success('Pengajuan cuti berhasil dibatalkan')
    } catch {
      toast.error('Gagal membatalkan pengajuan cuti')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!cuti) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Data cuti tidak ditemukan</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/cuti">Kembali</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/cuti' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Detail Cuti</h2>
          <p className="text-muted-foreground">ID: #{cuti.usulcuti_id}</p>
        </div>
        <Badge variant="secondary" className={`ml-auto ${statusColors[cuti.usulcuti_status]}`}>
          {cuti.usulcuti_status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Pegawai" value={`${cuti.pegawai_nama} (${cuti.pegawai_nip})`} />
          <InfoRow label="Jenis Cuti" value={cuti.jeniscuti_nama ?? '-'} />
          <Separator />
          <InfoRow
            label="Periode"
            value={`${format(new Date(cuti.usulcuti_tglawal), 'dd MMMM yyyy', { locale: localeId })} - ${format(new Date(cuti.usulcuti_tglakhir), 'dd MMMM yyyy', { locale: localeId })}`}
          />
          <InfoRow label="Jumlah Hari" value={`${cuti.usulcuti_jumlah} hari`} />
          <Separator />
          <InfoRow label="Alasan" value={cuti.usulcuti_alasan} />
          <InfoRow label="Alamat Selama Cuti" value={cuti.usulcuti_alamat ?? '-'} />
          <InfoRow label="Lokasi" value={cuti.usulcuti_lokasi ?? '-'} />
          <Separator />
          <InfoRow label="Atasan Langsung" value={cuti.atasanlangsung_nama ?? '-'} />
          <InfoRow label="Status Atasan" value={cuti.atasanlangsung_status ?? '-'} />
          <InfoRow label="Pejabat Berwenang" value={cuti.pejabat_nama ?? '-'} />
          <InfoRow label="Status Pejabat" value={cuti.pejabat_status ?? '-'} />
          <Separator />
          <InfoRow
            label="Tanggal Pengajuan"
            value={format(new Date(cuti.created_at), 'dd MMMM yyyy HH:mm', {
              locale: localeId,
            })}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {canVerify && (
          <>
            <Button
              onClick={() => handleStatusUpdate('Terima')}
              disabled={updateStatus.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Setujui
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('Ditolak')}
              disabled={updateStatus.isPending}
            >
              Tolak
            </Button>
          </>
        )}
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Batalkan Pengajuan</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan Pengajuan Cuti?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pengajuan cuti ini akan dibatalkan. Tindakan ini tidak dapat diurungkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Tidak</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={cancelCuti.isPending}
                >
                  Ya, Batalkan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <span className="min-w-[180px] text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
