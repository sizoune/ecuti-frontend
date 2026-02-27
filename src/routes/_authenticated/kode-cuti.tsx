import { createFileRoute, redirect } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/_authenticated/kode-cuti')({
  beforeLoad: () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.role !== 'Admin SKPD') {
        throw redirect({ to: '/' })
      }
    }
  },
  component: KodeCutiPage,
})

function KodeCutiPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kode Cuti</h2>
        <p className="text-muted-foreground">Kelola kode dan jenis cuti</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manajemen Kode Cuti
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          Fitur manajemen kode cuti dalam tahap pengembangan
        </CardContent>
      </Card>
    </div>
  )
}
