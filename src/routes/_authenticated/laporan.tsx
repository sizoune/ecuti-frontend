import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BarChart3, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '#/lib/auth'
import { formatNamaGelar } from '#/lib/utils'
import {
  useLaporanDashboard,
  useLaporanCutiBulanan,
  useLaporanRekapitulasi,
  useBukuCuti,
} from '#/hooks/use-laporan'
import { useSkpdList } from '#/hooks/use-master'
import { usePegawaiSearch } from '#/hooks/use-pegawai'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { Badge } from '#/components/ui/badge'
import type { LaporanDashboardItem, CutiStatus } from '#/types'

export const Route = createFileRoute('/_authenticated/laporan')({
  component: LaporanPage,
})

const STATUS_COLORS: Record<string, string> = {
  Verifikasi: '#3b82f6',
  BTL: '#6366f1',
  Ditolak: '#ef4444',
  Batal: '#6b7280',
  Proses: '#f59e0b',
  Terima: '#22c55e',
}

const BULAN_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

function getStatusVariant(status: CutiStatus) {
  switch (status) {
    case 'Terima':
      return 'default' as const
    case 'Ditolak':
      return 'destructive' as const
    case 'Batal':
    case 'BTL':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function LaporanPage() {
  const { user } = useAuth()
  const isAdmin = user && user.role !== 'Pegawai'
  const isPegawai = user?.role === 'Pegawai'
  const isSuperAdmin = user?.role === 'Super Admin'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan</h2>
        <p className="text-muted-foreground">Laporan dan rekap data cuti</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="cuti-bulanan">Cuti Bulanan</TabsTrigger>}
          {isAdmin && <TabsTrigger value="rekapitulasi">Rekapitulasi</TabsTrigger>}
          <TabsTrigger value="buku-cuti">Buku Cuti</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="cuti-bulanan">
            <CutiBulananTab isSuperAdmin={!!isSuperAdmin} />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="rekapitulasi">
            <RekapitulasiTab isSuperAdmin={!!isSuperAdmin} />
          </TabsContent>
        )}
        <TabsContent value="buku-cuti">
          <BukuCutiTab
            isPegawai={!!isPegawai}
            defaultPegawaiId={user?.pegawai_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ Tab 1: Dashboard ============

function DashboardTab() {
  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)
  const { data, isLoading } = useLaporanDashboard(tahun)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Tahun</label>
        <Input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-28"
          min={2020}
          max={2099}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <DashboardPieCard key={item.jeniscuti_id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Tidak ada data laporan untuk tahun {tahun}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DashboardPieCard({ item }: { item: LaporanDashboardItem }) {
  const pieData = [
    { name: 'Verifikasi', value: item.verifikasi },
    { name: 'BTL', value: item.btl },
    { name: 'Ditolak', value: item.ditolak },
    { name: 'Batal', value: item.batal },
    { name: 'Proses', value: item.proses },
    { name: 'Terima', value: item.terima },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {item.jeniscuti_nama}
        </CardTitle>
        <p className="text-2xl font-bold">{item.total}</p>
      </CardHeader>
      <CardContent>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Tidak ada data
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ Tab 2: Cuti Bulanan ============

function CutiBulananTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [tahun, setTahun] = useState(currentYear)
  const [bulan, setBulan] = useState(currentMonth)
  const [skpdId, setSkpdId] = useState<number | undefined>()

  const { data: skpdList } = useSkpdList()
  const { data, isLoading } = useLaporanCutiBulanan({
    tahun,
    bulan,
    skpd_id: skpdId,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tahun</label>
          <Input
            type="number"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="w-28"
            min={2020}
            max={2099}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Bulan</label>
          <Select
            value={String(bulan)}
            onValueChange={(v) => setBulan(Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BULAN_OPTIONS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">SKPD</label>
            <Select
              value={skpdId ? String(skpdId) : 'all'}
              onValueChange={(v) => setSkpdId(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-64">
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
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Jenis Cuti</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-center">Hari</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={item.usulcuti_id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.pegawai_nip}
                    </TableCell>
                    <TableCell>
                      {formatNamaGelar(
                        item.pegawai_nama,
                        item.pegawai_gelardepan,
                        item.pegawai_gelarbelakang,
                      )}
                    </TableCell>
                    <TableCell>{item.jabatan_nama}</TableCell>
                    <TableCell>{item.jeniscuti_nama}</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(item.usulcuti_tglawal)} -{' '}
                      {formatDate(item.usulcuti_tglakhir)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.usulcuti_jumlah}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.usulcuti_status)}>
                        {item.usulcuti_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Tidak ada data cuti untuk periode ini
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Tab 3: Rekapitulasi ============

function RekapitulasiTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)
  const [skpdId, setSkpdId] = useState<number | undefined>()

  const { data: skpdList } = useSkpdList()
  const { data, isLoading } = useLaporanRekapitulasi({
    tahun,
    skpd_id: skpdId,
  })

  const MONTH_KEYS = [
    'jan', 'feb', 'mar', 'apr', 'mei', 'jun',
    'jul', 'ags', 'sep', 'okt', 'nov', 'des',
  ] as const
  const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tahun</label>
          <Input
            type="number"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="w-28"
            min={2020}
            max={2099}
          />
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">SKPD</label>
            <Select
              value={skpdId ? String(skpdId) : 'all'}
              onValueChange={(v) => setSkpdId(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-64">
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
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Cuti</TableHead>
                  {MONTH_LABELS.map((m) => (
                    <TableHead key={m} className="text-center">
                      {m}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.jeniscuti_id}>
                    <TableCell className="font-medium">
                      {item.jeniscuti_nama}
                    </TableCell>
                    {MONTH_KEYS.map((key) => (
                      <TableCell key={key} className="text-center">
                        {item[key] || 0}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold">
                      {item.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Tidak ada data rekapitulasi untuk tahun {tahun}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Tab 4: Buku Cuti ============

function BukuCutiTab({
  isPegawai,
  defaultPegawaiId,
}: {
  isPegawai: boolean
  defaultPegawaiId?: number
}) {
  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)
  const [pegawaiId, setPegawaiId] = useState<number | undefined>(
    isPegawai ? defaultPegawaiId : undefined,
  )
  const [searchQuery, setSearchQuery] = useState('')

  const { data: searchResults } = usePegawaiSearch(searchQuery)
  const { data, isLoading } = useBukuCuti(pegawaiId, tahun)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {!isPegawai && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Pegawai</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari NIP atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 pl-9"
              />
              {searchQuery.length >= 3 && searchResults?.data && searchResults.data.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                  {searchResults.data.map((p) => (
                    <button
                      key={p.pegawai_id}
                      type="button"
                      className="flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      onClick={() => {
                        setPegawaiId(p.pegawai_id)
                        setSearchQuery(
                          formatNamaGelar(
                            p.pegawai_nama,
                            p.pegawai_gelardepan,
                            p.pegawai_gelarbelakang,
                          ),
                        )
                      }}
                    >
                      <span className="font-medium">
                        {formatNamaGelar(
                          p.pegawai_nama,
                          p.pegawai_gelardepan,
                          p.pegawai_gelarbelakang,
                        )}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.pegawai_nip}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tahun</label>
          <Input
            type="number"
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="w-28"
            min={2020}
            max={2099}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!pegawaiId ? (
            <p className="py-8 text-center text-muted-foreground">
              {isPegawai
                ? 'Data buku cuti tidak tersedia'
                : 'Pilih pegawai untuk melihat buku cuti'}
            </p>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Jenis Cuti</TableHead>
                  <TableHead className="text-center">Tahun</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, idx) => (
                  <TableRow key={item.bukucuti_id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.jeniscuti_nama}</TableCell>
                    <TableCell className="text-center">
                      {item.bukucuti_tahun}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.bukucuti_status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Tidak ada data buku cuti
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Helpers ============

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
