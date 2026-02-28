import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '#/lib/auth'
import {
  useKodeCutiList,
  useCreateKodeCuti,
  useUpdateKodeCuti,
  useDeleteKodeCuti,
} from '#/hooks/use-kode-cuti'
import { useSkpdList } from '#/hooks/use-master'
import type { KodeCuti } from '#/types'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '#/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/kode-cuti')({
  beforeLoad: () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (!['Super Admin', 'Admin SKPD', 'Admin Uker'].includes(user.role)) {
        throw redirect({ to: '/' })
      }
    }
  },
  component: KodeCutiPage,
})

function KodeCutiPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'Super Admin'
  const isAdminSkpd = user?.role === 'Admin SKPD'
  const canMutate = isSuperAdmin || isAdminSkpd

  const [filterSkpdId, setFilterSkpdId] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editItem, setEditItem] = useState<KodeCuti | null>(null)
  const [deleteItem, setDeleteItem] = useState<KodeCuti | null>(null)

  const skpdIdParam =
    isSuperAdmin && filterSkpdId && filterSkpdId !== 'all'
      ? Number(filterSkpdId)
      : undefined

  const { data: kodeCutiList, isLoading } = useKodeCutiList(skpdIdParam)
  const { data: skpdList } = useSkpdList()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kode Cuti</h2>
        <p className="text-muted-foreground">
          Pengaturan kode surat cuti per SKPD
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Daftar Kode Cuti</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              {isSuperAdmin && (
                <Select
                  value={filterSkpdId}
                  onValueChange={(v) => setFilterSkpdId(v)}
                >
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
              )}
              {canMutate && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kode Cuti
                </Button>
              )}
            </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Kode Awal</TableHead>
                  <TableHead>Kode Tengah</TableHead>
                  {canMutate && <TableHead className="w-24">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {kodeCutiList && kodeCutiList.length > 0 ? (
                  kodeCutiList.map((item, idx) => (
                    <TableRow key={item.kode_id}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono">{item.kode_awal}</TableCell>
                      <TableCell className="font-mono">{item.kode_tengah}</TableCell>
                      {canMutate && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditItem(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteItem(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={canMutate ? 4 : 3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada kode cuti
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <CreateKodeCutiDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          isSuperAdmin={isSuperAdmin}
          skpdId={user?.skpd_id}
          skpdList={skpdList ?? []}
        />
      )}

      {editItem && (
        <EditKodeCutiDialog
          item={editItem}
          onOpenChange={(open) => {
            if (!open) setEditItem(null)
          }}
        />
      )}

      {deleteItem && (
        <DeleteKodeCutiDialog
          item={deleteItem}
          onOpenChange={(open) => {
            if (!open) setDeleteItem(null)
          }}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Create Dialog
// ──────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSuperAdmin: boolean
  skpdId?: number
  skpdList: Array<{ skpd_id: number; skpd_nama: string }>
}

function CreateKodeCutiDialog({
  open,
  onOpenChange,
  isSuperAdmin,
  skpdId,
  skpdList,
}: CreateDialogProps) {
  const [kodeAwal, setKodeAwal] = useState('')
  const [kodeTengah, setKodeTengah] = useState('')
  const [selectedSkpdId, setSelectedSkpdId] = useState<string>(
    skpdId ? String(skpdId) : '',
  )

  const createMutation = useCreateKodeCuti()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedSkpdId = isSuperAdmin ? Number(selectedSkpdId) : (skpdId ?? 0)
    if (!resolvedSkpdId) {
      toast.error('Pilih SKPD terlebih dahulu')
      return
    }
    try {
      await createMutation.mutateAsync({
        skpd_id: resolvedSkpdId,
        kode_awal: kodeAwal.trim(),
        kode_tengah: kodeTengah.trim(),
      })
      toast.success('Kode cuti berhasil ditambahkan')
      onOpenChange(false)
    } catch {
      toast.error('Gagal menambahkan kode cuti')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kode Cuti</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="create-skpd">SKPD</Label>
              <Select
                value={selectedSkpdId}
                onValueChange={setSelectedSkpdId}
              >
                <SelectTrigger id="create-skpd">
                  <SelectValue placeholder="Pilih SKPD" />
                </SelectTrigger>
                <SelectContent>
                  {skpdList.map((s) => (
                    <SelectItem key={s.skpd_id} value={String(s.skpd_id)}>
                      {s.skpd_nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="create-kode-awal">Kode Awal</Label>
            <Input
              id="create-kode-awal"
              value={kodeAwal}
              onChange={(e) => setKodeAwal(e.target.value)}
              placeholder="Contoh: 800"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-kode-tengah">Kode Tengah</Label>
            <Input
              id="create-kode-tengah"
              value={kodeTengah}
              onChange={(e) => setKodeTengah(e.target.value)}
              placeholder="Contoh: 100"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Edit Dialog (wrapper to call hook with item id)
// ──────────────────────────────────────────────

interface EditDialogProps {
  item: KodeCuti
  onOpenChange: (open: boolean) => void
}

function EditKodeCutiDialog({ item, onOpenChange }: EditDialogProps) {
  const [kodeAwal, setKodeAwal] = useState(item.kode_awal)
  const [kodeTengah, setKodeTengah] = useState(item.kode_tengah)

  const updateMutation = useUpdateKodeCuti(item.kode_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({
        kode_awal: kodeAwal.trim(),
        kode_tengah: kodeTengah.trim(),
      })
      toast.success('Kode cuti berhasil diperbarui')
      onOpenChange(false)
    } catch {
      toast.error('Gagal memperbarui kode cuti')
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kode Cuti</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-kode-awal">Kode Awal</Label>
            <Input
              id="edit-kode-awal"
              value={kodeAwal}
              onChange={(e) => setKodeAwal(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-kode-tengah">Kode Tengah</Label>
            <Input
              id="edit-kode-tengah"
              value={kodeTengah}
              onChange={(e) => setKodeTengah(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Delete Confirmation Dialog
// ──────────────────────────────────────────────

interface DeleteDialogProps {
  item: KodeCuti
  onOpenChange: (open: boolean) => void
}

function DeleteKodeCutiDialog({ item, onOpenChange }: DeleteDialogProps) {
  const deleteMutation = useDeleteKodeCuti()

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(item.kode_id)
      toast.success('Kode cuti berhasil dihapus')
      onOpenChange(false)
    } catch {
      toast.error('Gagal menghapus kode cuti')
    }
  }

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Kode Cuti</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus kode cuti{' '}
            <span className="font-semibold">
              {item.kode_awal} / {item.kode_tengah}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
