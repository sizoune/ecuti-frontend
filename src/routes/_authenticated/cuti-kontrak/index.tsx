import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { Plus, Check, X, Ban } from 'lucide-react'
import {
  useCutiKontrakList,
  useUpdateCutiKontrakStatus,
  useCancelCutiKontrak,
} from '#/hooks/use-cuti-kontrak'
import { useAuth } from '#/lib/auth'
import type { CutiKontrak, CutiStatus } from '#/types'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
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

export const Route = createFileRoute('/_authenticated/cuti-kontrak/')({
  component: CutiKontrakPage,
})

const STATUS_LIST: CutiStatus[] = ['Verifikasi', 'Proses', 'Terima', 'Ditolak', 'Batal', 'BTL']

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

function getStatusBadgeVariant(status: CutiStatus) {
  switch (status) {
    case 'Verifikasi':
      return 'outline' as const
    case 'Proses':
      return 'default' as const
    case 'Terima':
      return 'default' as const
    case 'Ditolak':
      return 'destructive' as const
    case 'Batal':
    case 'BTL':
      return 'secondary' as const
  }
}

function getStatusBadgeClassName(status: CutiStatus) {
  if (status === 'Terima') return 'bg-green-600 hover:bg-green-700 text-white'
  return ''
}

// Row-level action component so each row has its own mutation hook instance
function RowActions({
  item,
  userRole,
  userPegawaiId,
}: {
  item: CutiKontrak
  userRole: string | undefined
  userPegawaiId: number | undefined
}) {
  const updateMutation = useUpdateCutiKontrakStatus(item.usulcutikontrak_id)
  const cancelMutation = useCancelCutiKontrak(item.usulcutikontrak_id)

  const isAdmin =
    userRole === 'Admin SKPD' || userRole === 'Admin Uker' || userRole === 'Super Admin'
  const isPegawai = userRole === 'Pegawai'
  const isOwner = isPegawai && userPegawaiId === item.pegawai_id

  const canAdminAct =
    isAdmin &&
    (item.usulcutikontrak_status === 'Verifikasi' || item.usulcutikontrak_status === 'Proses')

  const canCancel = isOwner && item.usulcutikontrak_status === 'Verifikasi'

  function handleApprove() {
    let payload = {}
    if (item.usulcutikontrak_status === 'Verifikasi') {
      payload = { usulcutikontrak_status: 'Proses' as CutiStatus, atasanlangsung_status: 'Terima' }
    } else if (item.usulcutikontrak_status === 'Proses') {
      payload = { usulcutikontrak_status: 'Terima' as CutiStatus, pejabat_status: 'Terima' }
    }
    updateMutation.mutate(payload, {
      onSuccess: () => toast.success('Status berhasil diperbarui'),
      onError: () => toast.error('Gagal memperbarui status'),
    })
  }

  function handleReject() {
    updateMutation.mutate(
      { usulcutikontrak_status: 'Ditolak' },
      {
        onSuccess: () => toast.success('Pengajuan berhasil ditolak'),
        onError: () => toast.error('Gagal menolak pengajuan'),
      },
    )
  }

  function handleCancel() {
    cancelMutation.mutate(undefined, {
      onSuccess: () => toast.success('Pengajuan berhasil dibatalkan'),
      onError: () => toast.error('Gagal membatalkan pengajuan'),
    })
  }

  if (!canAdminAct && !canCancel) return null

  return (
    <div className="flex items-center gap-1">
      {canAdminAct && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-green-600 border-green-300 hover:bg-green-50"
                disabled={updateMutation.isPending}
              >
                <Check className="h-3 w-3 mr-1" />
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
                <AlertDialogAction onClick={handleApprove}>Setujui</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
                disabled={updateMutation.isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Tolak
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tolak Pengajuan</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menolak pengajuan cuti kontrak ini?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReject}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Tolak
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
              className="h-7 px-2 text-gray-600 border-gray-300 hover:bg-gray-50"
              disabled={cancelMutation.isPending}
            >
              <Ban className="h-3 w-3 mr-1" />
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
              <AlertDialogAction onClick={handleCancel}>Ya, Batalkan</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

function CutiKontrakPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [tahun, setTahun] = useState<string>(String(currentYear))

  const { data, isLoading, isError } = useCutiKontrakList({
    page,
    limit: 10,
    status: status && status !== 'all' ? status : undefined,
    tahun: tahun && tahun !== 'all' ? Number(tahun) : undefined,
  })

  const isPegawai = user?.role === 'Pegawai'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuti Kontrak</h2>
          <p className="text-muted-foreground">Daftar pengajuan cuti pegawai kontrak</p>
        </div>
        {isPegawai && (
          <Button asChild>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link to={'/cuti-kontrak/buat' as any}>
              <Plus className="mr-2 h-4 w-4" />
              Ajukan Cuti
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base">Filter</CardTitle>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tahun} onValueChange={(v) => { setTahun(v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-muted-foreground">
              Gagal memuat data. Silakan coba lagi nanti.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Pegawai</TableHead>
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Jumlah Hari</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((item, index) => (
                      <TableRow key={item.usulcutikontrak_id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {(page - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {[item.pegawai_gelardepan, item.pegawai_nama, item.pegawai_gelarbelakang]
                                .filter(Boolean)
                                .join(' ')}
                            </div>
                            {item.pegawai_nip && (
                              <div className="text-xs text-muted-foreground">{item.pegawai_nip}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.jeniscuti_nama ?? '-'}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(item.usulcutikontrak_tglawal), 'd MMM yyyy', {
                            locale: localeId,
                          })}{' '}
                          -{' '}
                          {format(new Date(item.usulcutikontrak_tglakhir), 'd MMM yyyy', {
                            locale: localeId,
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.usulcutikontrak_jumlah} hari
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(item.usulcutikontrak_status)}
                            className={getStatusBadgeClassName(item.usulcutikontrak_status)}
                          >
                            {item.usulcutikontrak_status}
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Belum ada data pengajuan cuti kontrak
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data && data.total > 10 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, data.total)} dari{' '}
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
  )
}
