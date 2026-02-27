import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { useCutiList } from '#/hooks/use-cuti'
import { useAuth } from '#/lib/auth'
import { formatNamaGelar } from '#/lib/utils'
import type { CutiStatus } from '#/types'
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

export const Route = createFileRoute('/_authenticated/cuti/')({
  component: CutiListPage,
})

const statusColors: Record<CutiStatus, string> = {
  Verifikasi: 'bg-yellow-100 text-yellow-800',
  Proses: 'bg-blue-100 text-blue-800',
  Terima: 'bg-green-100 text-green-800',
  Ditolak: 'bg-red-100 text-red-800',
  Batal: 'bg-gray-100 text-gray-800',
  BTL: 'bg-orange-100 text-orange-800',
}

function CutiListPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')

  const { data, isLoading, isError } = useCutiList({
    page,
    limit: 10,
    status: (status && status !== 'all' ? status : undefined) as CutiStatus | undefined,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pengajuan Cuti</h2>
          <p className="text-muted-foreground">
            {user?.role === 'Pegawai'
              ? 'Daftar pengajuan cuti Anda'
              : 'Daftar semua pengajuan cuti'}
          </p>
        </div>
        <Button asChild>
          <Link to="/cuti/buat">
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Cuti
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Filter</CardTitle>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
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
              Gagal memuat data cuti. Silakan coba lagi nanti.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal Pengajuan</TableHead>
                    {user?.role !== 'Pegawai' && <TableHead>Pegawai</TableHead>}
                    <TableHead>Jenis Cuti</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((cuti) => (
                      <TableRow key={cuti.usulcuti_id}>
                        <TableCell className="text-sm">
                          {format(new Date(cuti.created_at), 'dd MMM yyyy', {
                            locale: localeId,
                          })}
                        </TableCell>
                        {user?.role !== 'Pegawai' && (
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatNamaGelar(cuti.pegawai_nama ?? '', cuti.pegawai_gelardepan, cuti.pegawai_gelarbelakang)}</div>
                              <div className="text-xs text-muted-foreground">{cuti.pegawai_nip}</div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>{cuti.jeniscuti_nama}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(cuti.usulcuti_tglawal), 'dd/MM/yyyy')} -{' '}
                          {format(new Date(cuti.usulcuti_tglakhir), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-center">{cuti.usulcuti_jumlah} hari</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[cuti.usulcuti_status]}>
                            {cuti.usulcuti_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to="/cuti/$id" params={{ id: String(cuti.usulcuti_id) }}>
                              Detail
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={user?.role !== 'Pegawai' ? 7 : 6} className="py-8 text-center text-muted-foreground">
                        Belum ada data pengajuan cuti
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data && data.total > 10 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)} dari{' '}
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
