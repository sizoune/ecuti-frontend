import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import { useCutiList, useUpdateCutiStatus } from '#/hooks/use-cuti'
import type { CutiStatus } from '#/types'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/verifikasi/')({
  component: VerifikasiPage,
})

const statusColors: Record<CutiStatus, string> = {
  Verifikasi: 'bg-yellow-100 text-yellow-800',
  Proses: 'bg-blue-100 text-blue-800',
  Terima: 'bg-green-100 text-green-800',
  Ditolak: 'bg-red-100 text-red-800',
  Batal: 'bg-gray-100 text-gray-800',
  BTL: 'bg-orange-100 text-orange-800',
}

function VerifikasiPage() {
  const [tab, setTab] = useState<string>('Verifikasi')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCutiList({
    page,
    limit: 10,
    status: tab as CutiStatus,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Verifikasi Cuti</h2>
        <p className="text-muted-foreground">Kelola verifikasi pengajuan cuti pegawai</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="Verifikasi">Menunggu</TabsTrigger>
          <TabsTrigger value="Proses">Proses</TabsTrigger>
          <TabsTrigger value="Terima">Disetujui</TabsTrigger>
          <TabsTrigger value="Ditolak">Ditolak</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Daftar Pengajuan - {tab}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                          <VerifikasiRow key={cuti.usulcuti_id} cuti={cuti} showActions={tab === 'Verifikasi'} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            Tidak ada data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {data && data.total > 10 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {(page - 1) * 10 + 1}-{Math.min(page * 10, data.total)} dari {data.total}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

function VerifikasiRow({ cuti, showActions }: { cuti: any; showActions: boolean }) {
  const updateStatus = useUpdateCutiStatus(cuti.usulcuti_id)

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ usulcuti_status: 'Terima' })
      toast.success('Cuti disetujui')
    } catch {
      toast.error('Gagal memperbarui status')
    }
  }

  const handleReject = async () => {
    try {
      await updateStatus.mutateAsync({ usulcuti_status: 'Ditolak' })
      toast.success('Cuti ditolak')
    } catch {
      toast.error('Gagal memperbarui status')
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">{cuti.pegawai_nama}</div>
          <div className="text-xs text-muted-foreground">{cuti.pegawai_nip}</div>
        </div>
      </TableCell>
      <TableCell>{cuti.jeniscuti_nama}</TableCell>
      <TableCell className="text-sm">
        {format(new Date(cuti.usulcuti_tglawal), 'dd/MM/yyyy')} -{' '}
        {format(new Date(cuti.usulcuti_tglakhir), 'dd/MM/yyyy')}
      </TableCell>
      <TableCell className="text-center">{cuti.usulcuti_jumlah}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={statusColors[cuti.usulcuti_status as CutiStatus]}>
          {cuti.usulcuti_status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {showActions && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={handleApprove}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600"
                onClick={handleReject}
                disabled={updateStatus.isPending}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
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
