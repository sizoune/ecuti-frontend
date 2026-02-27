import { createFileRoute } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/_authenticated/laporan')({
  component: LaporanPage,
})

function LaporanPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Laporan</h2>
        <p className="text-muted-foreground">Laporan dan rekap data cuti</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Laporan Cuti
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          Fitur laporan dalam tahap pengembangan
        </CardContent>
      </Card>
    </div>
  )
}
