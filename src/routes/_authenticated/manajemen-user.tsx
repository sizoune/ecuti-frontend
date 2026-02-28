import { useState, useEffect, useRef } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Plus, Trash2, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '#/lib/auth'
import {
  useUserRoleList,
  useAssignRole,
  useRemoveRole,
} from '#/hooks/use-manajemen-user'
import { useSkpdList } from '#/hooks/use-master'
import { usePegawaiSearch } from '#/hooks/use-pegawai'
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
import type { UserRoleAssignment, Pegawai } from '#/types'

export const Route = createFileRoute('/_authenticated/manajemen-user')({
  beforeLoad: () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.role !== 'Super Admin') {
        throw redirect({ to: '/' })
      }
    }
  },
  component: ManajemenUserPage,
})

const LIMIT = 10

const ROLE_LABELS: Record<number, string> = {
  1: 'Super Admin',
  2: 'Admin SKPD',
  3: 'Admin Uker',
  4: 'Pegawai',
}

const ROLE_BADGE_CLASS: Record<number, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-purple-100 text-purple-800 border-purple-200',
  4: 'bg-gray-100 text-gray-700 border-gray-200',
}

function ManajemenUserPage() {
  useAuth()

  const [page, setPage] = useState(1)
  const [skpdFilter, setSkpdFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useUserRoleList({
    page,
    limit: LIMIT,
    skpd_id: skpdFilter && skpdFilter !== 'all' ? Number(skpdFilter) : undefined,
    role_id: roleFilter && roleFilter !== 'all' ? Number(roleFilter) : undefined,
  })

  const { data: skpdList } = useSkpdList()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manajemen User</h2>
        <p className="text-muted-foreground">Kelola peran pengguna sistem e-Cuti</p>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={skpdFilter}
              onValueChange={(v) => { setSkpdFilter(v); setPage(1) }}
            >
              <SelectTrigger className="w-[240px] h-9">
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

            <Select
              value={roleFilter}
              onValueChange={(v) => { setRoleFilter(v); setPage(1) }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="1">Super Admin</SelectItem>
                <SelectItem value="2">Admin SKPD</SelectItem>
                <SelectItem value="3">Admin Uker</SelectItem>
                <SelectItem value="4">Pegawai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Role
          </Button>
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
                    <TableHead>Nama Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((item, idx) => (
                      <TableRow key={`${item.pegawai_id}-${item.role_id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-muted-foreground">{(page - 1) * LIMIT + idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.pegawai_nama ?? '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {item.pegawai_nip ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={ROLE_BADGE_CLASS[item.role_id] ?? 'bg-gray-100 text-gray-700'}
                          >
                            {item.role_nama ?? ROLE_LABELS[item.role_id] ?? `Role ${item.role_id}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DeleteRoleButton item={item} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <Users className="h-10 w-10 opacity-30" />
                          <div>
                            <p className="font-medium text-sm">Belum ada penugasan role</p>
                            <p className="text-xs mt-1">Tambahkan role kepada pegawai menggunakan tombol di atas.</p>
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

      <AssignRoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skpdList={skpdList ?? []}
      />
    </div>
  )
}

function DeleteRoleButton({ item }: { item: UserRoleAssignment }) {
  const { mutate, isPending } = useRemoveRole()

  function handleDelete() {
    mutate(
      { pegawaiId: item.pegawai_id, roleId: item.role_id },
      {
        onSuccess: () => {
          toast.success('Role berhasil dihapus')
        },
        onError: () => {
          toast.error('Gagal menghapus role')
        },
      },
    )
  }

  const roleName = item.role_nama ?? ROLE_LABELS[item.role_id] ?? `Role ${item.role_id}`

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
          <AlertDialogTitle>Hapus Role Pengguna</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus role <strong>{roleName}</strong> dari{' '}
            <strong>{item.pegawai_nama ?? `Pegawai #${item.pegawai_id}`}</strong>? Tindakan
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

interface Skpd {
  skpd_id: number
  skpd_nama: string
}

function AssignRoleDialog({
  open,
  onOpenChange,
  skpdList,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  skpdList: Skpd[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [roleId, setRoleId] = useState<string>('')
  const [skpdId, setSkpdId] = useState<string>('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { mutate, isPending } = useAssignRole()

  const { data: searchData, isFetching } = usePegawaiSearch(debouncedSearch)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function resetForm() {
    setSearchTerm('')
    setDebouncedSearch('')
    setSelectedPegawai(null)
    setRoleId('')
    setSkpdId('')
    setShowResults(false)
  }

  function handleSelectPegawai(p: Pegawai) {
    setSelectedPegawai(p)
    setSearchTerm(`${p.pegawai_nama} (${p.pegawai_nip})`)
    setShowResults(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPegawai || !roleId || !skpdId) return

    mutate(
      {
        pegawai_id: selectedPegawai.pegawai_id,
        role_id: Number(roleId),
        skpd_id: Number(skpdId),
      },
      {
        onSuccess: () => {
          toast.success('Role berhasil ditetapkan')
          onOpenChange(false)
          resetForm()
        },
        onError: () => {
          toast.error('Gagal menetapkan role')
        },
      },
    )
  }

  const pegawaiResults = searchData?.data ?? []
  const showDropdown = showResults && debouncedSearch.length >= 3 && pegawaiResults.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Role Pengguna</DialogTitle>
          <DialogDescription>
            Cari pegawai lalu tetapkan role dan SKPD yang sesuai.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5" ref={searchRef}>
              <Label htmlFor="pegawai-search">Pegawai</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pegawai-search"
                  placeholder="Ketik minimal 3 huruf untuk mencari..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setSelectedPegawai(null)
                    setShowResults(true)
                  }}
                  onFocus={() => {
                    if (debouncedSearch.length >= 3) setShowResults(true)
                  }}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {debouncedSearch.length >= 3 && showResults && (
                <div className="relative">
                  <div className="absolute z-50 w-full rounded-md border bg-popover shadow-md">
                    {isFetching ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Mencari...
                      </div>
                    ) : pegawaiResults.length > 0 ? (
                      <ul className="max-h-48 overflow-auto py-1">
                        {pegawaiResults.map((p) => (
                          <li
                            key={p.pegawai_id}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelectPegawai(p)
                            }}
                          >
                            <span className="font-medium">{p.pegawai_nama}</span>
                            <span className="ml-2 text-muted-foreground font-mono text-xs">
                              {p.pegawai_nip}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Pegawai tidak ditemukan
                      </div>
                    )}
                  </div>
                </div>
              )}
              {showDropdown && <div className="h-0" />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-select">Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Pilih role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Admin SKPD</SelectItem>
                  <SelectItem value="3">Admin Uker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skpd-select">SKPD</Label>
              <Select value={skpdId} onValueChange={setSkpdId}>
                <SelectTrigger id="skpd-select">
                  <SelectValue placeholder="Pilih SKPD..." />
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
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); resetForm() }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedPegawai || !roleId || !skpdId}
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
