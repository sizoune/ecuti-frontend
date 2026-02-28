import { useNavigate } from '@tanstack/react-router'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '#/lib/auth'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Separator } from '#/components/ui/separator'
import { ThemeToggle } from '#/components/theme-toggle'

const roleVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Super Admin': 'destructive',
  'Admin SKPD': 'default',
  'Admin Uker': 'default',
  Pegawai: 'secondary',
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.pegawai_nama
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?'

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  const role = user?.role ?? ''

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="hidden sm:block text-sm font-semibold tracking-tight">
        E-Cuti
      </h1>
      <span className="hidden md:block text-xs text-muted-foreground">
        Sistem Manajemen Cuti
      </span>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />

        {role && (
          <Badge
            variant={roleVariant[role] ?? 'secondary'}
            className="hidden sm:inline-flex text-xs"
          >
            {role}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <span className="hidden md:block text-sm font-medium max-w-[140px] truncate">
              {user?.pegawai_nama}
            </span>
            <Avatar className="h-8 w-8 border-2 border-primary/20 ring-1 ring-primary/10">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user?.pegawai_nama}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  NIP: {user?.pegawai_nip}
                </span>
                {role && (
                  <Badge
                    variant={roleVariant[role] ?? 'secondary'}
                    className="mt-1 w-fit text-xs"
                  >
                    {role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: '/profil' })}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
