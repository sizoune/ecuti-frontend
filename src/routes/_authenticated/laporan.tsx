import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  BarChart3,
  Search,
  Calendar,
  TableProperties,
  BookOpen,
  FileX,
} from 'lucide-react'
import { useMemo } from 'react'
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <FileX className="h-10 w-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
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
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="cuti-bulanan" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Cuti Bulanan
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="rekapitulasi" className="gap-1.5">
              <TableProperties className="h-4 w-4" />
              Rekapitulasi
            </TabsTrigger>
          )}
          <TabsTrigger value="buku-cuti" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            Buku Cuti
          </TabsTrigger>
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
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tahun
              </label>
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
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
          <CardContent>
            <EmptyState message={`Tidak ada data laporan untuk tahun ${tahun}`} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DonutChart({
  data,
  size = 130,
  strokeWidth = 22,
  centerLabel,
}: {
  data: { name: string; value: number; color: string }[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
}) {
  const segments = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    if (total === 0) return []
    const radius = (size - strokeWidth) / 2
    const cx = size / 2
    const cy = size / 2
    const gap = data.length > 1 ? 0.03 : 0 // small gap in radians between segments
    let cumulative = 0

    return data.map((d) => {
      const startFrac = cumulative / total
      cumulative += d.value
      const endFrac = cumulative / total

      const startAngle = startFrac * Math.PI * 2 - Math.PI / 2 + gap
      const endAngle = endFrac * Math.PI * 2 - Math.PI / 2 - gap
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)

      // For single-item data, draw a full circle
      if (data.length === 1) {
        return {
          ...d,
          path: `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`,
        }
      }

      return {
        ...d,
        path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      }
    })
  }, [data, size, strokeWidth])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => (
        <path
          key={seg.name}
          d={seg.path}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
      ))}
      {centerLabel && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

function DashboardPieCard({ item }: { item: LaporanDashboardItem }) {
  const pieData = [
    { name: 'Verifikasi', value: Number(item.verifikasi) || 0, color: STATUS_COLORS.Verifikasi },
    { name: 'BTL', value: Number(item.btl) || 0, color: STATUS_COLORS.BTL },
    { name: 'Ditolak', value: Number(item.ditolak) || 0, color: STATUS_COLORS.Ditolak },
    { name: 'Batal', value: Number(item.batal) || 0, color: STATUS_COLORS.Batal },
    { name: 'Proses', value: Number(item.proses) || 0, color: STATUS_COLORS.Proses },
    { name: 'Terima', value: Number(item.terima) || 0, color: STATUS_COLORS.Terima },
  ].filter((d) => d.value > 0)

  const total = pieData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {item.jeniscuti_nama}
        </CardTitle>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold">{item.total}</span>
          <span className="text-xs text-muted-foreground">pengajuan</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {pieData.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <DonutChart data={pieData} centerLabel={String(total)} />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-muted-foreground">
                    {d.name}{' '}
                    <span className="font-medium text-foreground">{d.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground">
            <FileX className="h-7 w-7 opacity-30" />
            <span className="text-xs">Belum ada data status</span>
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
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tahun
              </label>
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
              <label className="text-sm font-medium text-muted-foreground">
                Bulan
              </label>
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
                <label className="text-sm font-medium text-muted-foreground">
                  SKPD
                </label>
                <Select
                  value={skpdId ? String(skpdId) : 'all'}
                  onValueChange={(v) =>
                    setSkpdId(v === 'all' ? undefined : Number(v))
                  }
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
        </CardContent>
      </Card>

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
                  <TableRow
                    key={item.usulcuti_id}
                    className={idx % 2 === 0 ? 'bg-muted/30' : ''}
                  >
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
            <EmptyState message="Tidak ada data cuti untuk periode ini" />
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
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tahun
              </label>
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
                <label className="text-sm font-medium text-muted-foreground">
                  SKPD
                </label>
                <Select
                  value={skpdId ? String(skpdId) : 'all'}
                  onValueChange={(v) =>
                    setSkpdId(v === 'all' ? undefined : Number(v))
                  }
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
        </CardContent>
      </Card>

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
                {data.map((item, idx) => (
                  <TableRow
                    key={item.jeniscuti_id}
                    className={idx % 2 === 0 ? 'bg-muted/30' : ''}
                  >
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
            <EmptyState
              message={`Tidak ada data rekapitulasi untuk tahun ${tahun}`}
            />
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
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            {!isPegawai && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Pegawai
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari NIP atau nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 pl-9"
                  />
                  {searchQuery.length >= 3 &&
                    searchResults?.data &&
                    searchResults.data.length > 0 && (
                      <div className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg ring-1 ring-black/5">
                        {searchResults.data.map((p) => (
                          <button
                            key={p.pegawai_id}
                            type="button"
                            className="flex w-full flex-col items-start rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
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
              <label className="text-sm font-medium text-muted-foreground">
                Tahun
              </label>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {!pegawaiId ? (
            <EmptyState
              message={
                isPegawai
                  ? 'Data buku cuti tidak tersedia'
                  : 'Pilih pegawai untuk melihat buku cuti'
              }
            />
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
                  <TableRow
                    key={item.bukucuti_id}
                    className={idx % 2 === 0 ? 'bg-muted/30' : ''}
                  >
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
            <EmptyState message="Tidak ada data buku cuti" />
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
