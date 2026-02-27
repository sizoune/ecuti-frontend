import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { usePegawaiList } from '#/hooks/use-pegawai'
import { useSkpdList } from '#/hooks/use-master'
import { Input } from '#/components/ui/input'
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
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/pegawai/')({
  beforeLoad: () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (!['Super Admin', 'Admin SKPD', 'Admin Uker'].includes(user.role)) {
        throw redirect({ to: '/' })
      }
    }
  },
  component: PegawaiListPage,
})

function PegawaiListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [skpdId, setSkpdId] = useState<string>('')

  const { data, isLoading } = usePegawaiList({
    page,
    limit: 10,
    search: search || undefined,
    skpd_id: skpdId && skpdId !== 'all' ? Number(skpdId) : undefined,
  })
  const { data: skpdList } = useSkpdList()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Pegawai</h2>
        <p className="text-muted-foreground">Daftar pegawai dalam sistem</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Filter</CardTitle>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NIP..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={skpdId} onValueChange={(v) => { setSkpdId(v); setPage(1) }}>
              <SelectTrigger className="w-[240px]">
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
                      <TableRow key={p.pegawai_id}>
                        <TableCell className="font-mono text-sm">{p.pegawai_nip}</TableCell>
                        <TableCell className="font-medium">{p.pegawai_nama}</TableCell>
                        <TableCell className="text-sm">{p.skpd_nama ?? '-'}</TableCell>
                        <TableCell className="text-sm">{p.golongan_nama ?? '-'}</TableCell>
                        <TableCell className="text-sm">{p.jabatan_nama ?? '-'}</TableCell>
                        <TableCell className="text-sm">{p.pegawai_kedudukanpns}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tidak ada data pegawai
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
    </div>
  )
}
