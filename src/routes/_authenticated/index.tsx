import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '#/lib/auth'
import { useCutiStatistics, useCutiBalance } from '#/hooks/use-cuti'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user && user.role !== 'Pegawai'
  const currentYear = new Date().getFullYear()

  const { data: stats, isLoading: statsLoading } = useCutiStatistics(
    undefined,
    currentYear,
    isAdmin ?? false,
  )
  const { data: balance, isLoading: balanceLoading } = useCutiBalance(
    undefined,
    currentYear,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Selamat datang, {user?.pegawai_nama}
        </p>
      </div>

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pengajuan"
            value={stats?.total_pengajuan}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            loading={statsLoading}
          />
          <StatCard
            title="Disetujui"
            value={stats?.total_disetujui}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            loading={statsLoading}
          />
          <StatCard
            title="Dalam Proses"
            value={stats?.total_proses}
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
            loading={statsLoading}
          />
          <StatCard
            title="Ditolak"
            value={stats?.total_ditolak}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            loading={statsLoading}
          />
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-semibold">Sisa Cuti Tahun {currentYear}</h3>
        {balanceLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : balance && balance.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balance.map((item) => (
              <Card key={item.jeniscuti_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.jeniscuti_nama}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.sisa}</div>
                  <p className="text-xs text-muted-foreground">
                    Terpakai {item.terpakai} dari {item.total} hari
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${item.total > 0 ? (item.terpakai / item.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Data sisa cuti tidak tersedia
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
  loading,
}: {
  title: string
  value?: number
  icon: React.ReactNode
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  )
}
