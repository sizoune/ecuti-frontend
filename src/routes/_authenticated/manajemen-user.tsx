import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

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

function ManajemenUserPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manajemen User</h2>
        <p className="text-muted-foreground">Kelola akun pengguna sistem</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Daftar User
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          Fitur manajemen user dalam tahap pengembangan
        </CardContent>
      </Card>
    </div>
  )
}
