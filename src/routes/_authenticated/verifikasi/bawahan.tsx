import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Inbox } from 'lucide-react'
import { useCutiList, useUpdateCutiStatus } from '#/hooks/use-cuti'
import type { CutiStatus } from '#/types'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
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
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/verifikasi/bawahan')({
  component: VerifikasiBawahanPage,
})

const statusConfig: Record<CutiStatus, { className: string; label: string }> = {
  Verifikasi: { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Menunggu' },
  Proses: { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Proses' },
  Terima: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Disetujui' },
  Ditolak: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Ditolak' },
  Batal: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Batal' },
  BTL: { className: 'bg-orange-100 text-orange-800 border-orange-200', label: 'BTL' },
}

function VerifikasiBawahanPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCutiList({
    page,
    limit: 10,
    status: 'Verifikasi',
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Verifikasi Cuti Bawahan</h2>
        <p className="text-muted-foreground">Kelola verifikasi cuti bawahan langsung Anda</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="h-4 w-4 text-primary" />
            Menunggu Verifikasi
          </CardTitle>
          <CardDescription>
            Pengajuan cuti bawahan yang memerlukan persetujuan Anda
          </CardDescription>
        </CardHeader>
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
                    <TableHead>Pegawai</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-center">Hari</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((cuti) => (
                      <BawahanRow key={cuti.usulcuti_id} cuti={cuti} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <Inbox className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="font-medium text-sm">Tidak ada pengajuan menunggu</p>
                            <p className="text-xs mt-1">Semua pengajuan cuti bawahan Anda telah diproses.</p>
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
                    {(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} dari {data.total}
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
  )
}

function BawahanRow({ cuti }: { cuti: any }) {
  const updateStatus = useUpdateCutiStatus(cuti.usulcuti_id)

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ atasanlangsung_status: 'Terima' })
      toast.success('Cuti bawahan disetujui')
    } catch {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleReject = async () => {
    try {
      await updateStatus.mutateAsync({ atasanlangsung_status: 'Ditolak' })
      toast.success('Cuti bawahan ditolak')
    } catch {
      toast.error('Gagal memperbarui status')
    }
  }

  const cfg = statusConfig[cuti.usulcuti_status as CutiStatus]

  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell>
        <div>
          <div className="font-medium">{cuti.pegawai_nama}</div>
          <div className="text-xs text-muted-foreground font-mono">{cuti.pegawai_nip}</div>
        </div>
      </TableCell>
      <TableCell className="text-sm">{cuti.jeniscuti_nama}</TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        {format(new Date(cuti.usulcuti_tglawal), 'dd/MM/yyyy')} –{' '}
        {format(new Date(cuti.usulcuti_tglakhir), 'dd/MM/yyyy')}
      </TableCell>
      <TableCell className="text-center font-medium">{cuti.usulcuti_jumlah}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={cfg?.className ?? ''}>
          {cfg?.label ?? cuti.usulcuti_status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Approve with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Setujui
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Setujui Pengajuan Cuti</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menyetujui pengajuan cuti dari{' '}
                  <strong>{cuti.pegawai_nama}</strong>?
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

          {/* Reject with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-3.5 w-3.5" />
                Tolak
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tolak Pengajuan Cuti</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menolak pengajuan cuti dari{' '}
                  <strong>{cuti.pegawai_nama}</strong>? Tindakan ini tidak dapat dibatalkan.
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

          <Button variant="ghost" size="sm" asChild>
            <Link to="/cuti/$id" params={{ id: String(cuti.usulcuti_id) }}>
              Detail
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
