import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  Clock,
  FileText,
  User,
  XCircle,
  Inbox,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '#/lib/auth'
import { useCutiStatistics, useCutiBalance } from '#/hooks/use-cuti'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user && user.role !== 'Pegawai'
  const currentYear = new Date().getFullYear()

  const now = new Date()
  const dateString = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const { data: stats, isLoading: statsLoading } = useCutiStatistics(
    undefined,
    currentYear,
    isAdmin ?? false,
  )
  const { data: balance, isLoading: balanceLoading } = useCutiBalance(
    undefined,
    currentYear,
  )

  const initials = user?.pegawai_nama
    ? user.pegawai_nama
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white" />
          <div className="absolute right-24 bottom-4 h-20 w-20 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white backdrop-blur-sm ring-2 ring-white/30">
              {initials}
            </div>
            <div>
              <p className="text-sm text-blue-100">Selamat datang kembali,</p>
              <h2 className="text-2xl font-bold leading-tight">
                {user?.pegawai_nama ?? 'Pengguna'}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs">
                  {user?.role ?? '-'}
                </Badge>
                <span className="text-xs text-blue-200">{dateString}</span>
              </div>
            </div>
          </div>
          {!isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm font-semibold"
              >
                <Link to="/cuti/buat">
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  Ajukan Cuti
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/profil">
                  <User className="mr-1.5 h-4 w-4" />
                  Profil
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/laporan">
                  <FileText className="mr-1.5 h-4 w-4" />
                  Laporan
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Stats Grid */}
      {isAdmin && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">
            Statistik Pengajuan Cuti {currentYear}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Pengajuan"
              value={stats?.total_pengajuan}
              icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
              iconBg="bg-blue-100"
              loading={statsLoading}
              trend="Total seluruh pengajuan"
            />
            <StatCard
              title="Disetujui"
              value={stats?.total_disetujui}
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              iconBg="bg-green-100"
              loading={statsLoading}
              trend="Pengajuan disetujui"
            />
            <StatCard
              title="Dalam Proses"
              value={stats?.total_proses}
              icon={<Clock className="h-5 w-5 text-amber-600" />}
              iconBg="bg-amber-100"
              loading={statsLoading}
              trend="Menunggu keputusan"
            />
            <StatCard
              title="Ditolak"
              value={stats?.total_ditolak}
              icon={<XCircle className="h-5 w-5 text-red-600" />}
              iconBg="bg-red-100"
              loading={statsLoading}
              trend="Pengajuan ditolak"
            />
          </div>
        </div>
      )}

      {/* Cuti Balance Section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-foreground">
            Sisa Cuti Tahun {currentYear}
          </h3>
        </div>

        {balanceLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : balance && balance.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balance.map((item) => (
              <Card
                key={item.jeniscuti_id}
                className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {item.jeniscuti_nama}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-3xl font-bold text-foreground">
                        {item.terpakai}
                      </span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        hari terpakai
                      </span>
                    </div>
                    <Badge variant="secondary" className="mb-1 text-xs">
                      {item.terpakai > 0 ? 'Aktif' : 'Belum dipakai'}
                    </Badge>
                  </div>
                  {/* Visual indicator bar based on days used */}
                  <div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${item.terpakai > 10 ? 'bg-red-500' : item.terpakai > 5 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, item.terpakai * 5)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.terpakai === 0 ? 'Belum ada penggunaan cuti' : `${item.terpakai} hari telah digunakan`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Belum ada data cuti
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Data penggunaan cuti tahun {currentYear} belum tersedia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  loading,
  trend,
}: {
  title: string
  value?: number
  icon: React.ReactNode
  iconBg: string
  loading: boolean
  trend: string
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <>
            <div className="text-3xl font-bold text-foreground">
              {value ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
