import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { useAuth } from '#/lib/auth'
import {
  useCutiBersamaList,
  useCreateCutiBersama,
  useDeleteCutiBersama,
} from '#/hooks/use-cuti-bersama'
import { Card, CardContent } from '#/components/ui/card'
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
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
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

export const Route = createFileRoute('/_authenticated/cuti-bersama')({
  beforeLoad: () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (!['Super Admin', 'Admin SKPD', 'Admin Uker'].includes(user.role)) {
        throw redirect({ to: '/' })
      }
    }
  },
  component: CutiBersamaPage,
})

const LIMIT = 10

function formatTanggal(dateString: string): string {
  try {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: id })
  } catch {
    return dateString
  }
}

function CutiBersamaPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'Super Admin'

  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCutiBersamaList({ tahun, page, limit: LIMIT })

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuti Bersama</h2>
        <p className="text-muted-foreground">
          Daftar hari cuti bersama berdasarkan tahun
        </p>
      </div>

      <Card>
        {/* Clean toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Tahun:</span>
            <Select
              value={String(tahun)}
              onValueChange={(v) => {
                setTahun(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin && (
            <CreateCutiBersamaDialog tahun={tahun} />
          )}
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
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Hari Libur</TableHead>
                    <TableHead>Tanggal Awal</TableHead>
                    <TableHead>Tanggal Akhir</TableHead>
                    <TableHead className="text-center">Jumlah Hari</TableHead>
                    <TableHead className="text-center">Tahun</TableHead>
                    {isSuperAdmin && (
                      <TableHead className="text-center">Aksi</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((item, idx) => (
                      <TableRow key={item.cutibersama_id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-muted-foreground">{(page - 1) * LIMIT + idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.cutibersama_nama}
                        </TableCell>
                        <TableCell className="text-sm">{formatTanggal(item.cutibersama_tglawal)}</TableCell>
                        <TableCell className="text-sm">{formatTanggal(item.cutibersama_tglakhir)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.cutibersama_jumlah} hari
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.cutibersama_tahun}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-center">
                            <DeleteCutiBersamaButton id={item.cutibersama_id} nama={item.cutibersama_nama} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isSuperAdmin ? 7 : 6}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <CalendarDays className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="font-medium text-sm">Tidak ada cuti bersama</p>
                            <p className="text-xs mt-1">Belum ada data cuti bersama untuk tahun {tahun}.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data && data.total > LIMIT && (
                <div className="flex items-center justify-between border-t px-6 py-3">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} dari{' '}
                    {data.total}
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
                      disabled={page * LIMIT >= data.total}
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

function CreateCutiBersamaDialog({ tahun }: { tahun: number }) {
  const [open, setOpen] = useState(false)
  const [nama, setNama] = useState('')
  const [tglawal, setTglawal] = useState('')
  const [tglakhir, setTglakhir] = useState('')
  const [jumlah, setJumlah] = useState('')
  const [formTahun, setFormTahun] = useState(String(tahun))

  const { mutate, isPending } = useCreateCutiBersama()

  function resetForm() {
    setNama('')
    setTglawal('')
    setTglakhir('')
    setJumlah('')
    setFormTahun(String(tahun))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate(
      {
        cutibersama_nama: nama,
        cutibersama_tglawal: tglawal,
        cutibersama_tglakhir: tglakhir,
        cutibersama_jumlah: Number(jumlah),
        cutibersama_tahun: Number(formTahun),
      },
      {
        onSuccess: () => {
          toast.success('Cuti bersama berhasil ditambahkan')
          setOpen(false)
          resetForm()
        },
        onError: () => {
          toast.error('Gagal menambahkan cuti bersama')
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Cuti Bersama
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Cuti Bersama</DialogTitle>
          <DialogDescription>
            Isi data hari cuti bersama yang akan ditambahkan ke sistem.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cb-nama">Nama Hari Libur</Label>
              <Input
                id="cb-nama"
                placeholder="Contoh: Hari Raya Idul Fitri"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cb-tglawal">Tanggal Awal</Label>
                <Input
                  id="cb-tglawal"
                  type="date"
                  value={tglawal}
                  onChange={(e) => setTglawal(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cb-tglakhir">Tanggal Akhir</Label>
                <Input
                  id="cb-tglakhir"
                  type="date"
                  value={tglakhir}
                  onChange={(e) => setTglakhir(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cb-jumlah">Jumlah Hari</Label>
                <Input
                  id="cb-jumlah"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cb-tahun">Tahun</Label>
                <Input
                  id="cb-tahun"
                  type="number"
                  min={2020}
                  max={2099}
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteCutiBersamaButton({
  id,
  nama,
}: {
  id: number
  nama: string
}) {
  const { mutate, isPending } = useDeleteCutiBersama()

  function handleDelete() {
    mutate(id, {
      onSuccess: () => {
        toast.success('Cuti bersama berhasil dihapus')
      },
      onError: () => {
        toast.error('Gagal menghapus cuti bersama')
      },
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Cuti Bersama</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{nama}</strong>? Tindakan
            ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
