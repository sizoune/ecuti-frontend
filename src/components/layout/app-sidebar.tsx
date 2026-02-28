import { Link, useRouterState } from '@tanstack/react-router'
import {
  BarChart3,
  CalendarDays,
  CheckCircle,
  FileText,
  Home,
  Settings,
  User,
  Users,
  UserCog,
  CalendarCheck,
  FileSignature,
  LogOut,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '#/lib/auth'
import type { UserRole } from '#/types'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '#/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'

interface NavItem {
  title: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  children?: { title: string; to: string; roles: UserRole[] }[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    to: '/',
    icon: Home,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker', 'Pegawai'],
  },
  {
    title: 'Data Saya',
    to: '/profil',
    icon: User,
    roles: ['Pegawai'],
  },
  {
    title: 'Data Pegawai',
    to: '/pegawai',
    icon: Users,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker'],
  },
  {
    title: 'Daftar Cuti',
    to: '/cuti',
    icon: CalendarDays,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker', 'Pegawai'],
  },
  {
    title: 'Cuti Kontrak',
    to: '/cuti-kontrak',
    icon: FileSignature,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker'],
  },
  {
    title: 'Cuti Bersama',
    to: '/cuti-bersama',
    icon: CalendarCheck,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker'],
  },
  {
    title: 'Verifikasi',
    to: '/verifikasi',
    icon: CheckCircle,
    roles: ['Admin SKPD', 'Admin Uker', 'Pegawai'],
    children: [
      {
        title: 'Verifikasi Cuti',
        to: '/verifikasi',
        roles: ['Admin SKPD', 'Admin Uker', 'Pegawai'],
      },
      {
        title: 'Verifikasi Bawahan',
        to: '/verifikasi/bawahan',
        roles: ['Admin SKPD', 'Admin Uker', 'Pegawai'],
      },
    ],
  },
  {
    title: 'Laporan',
    to: '/laporan',
    icon: BarChart3,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker', 'Pegawai'],
  },
  {
    title: 'Kode Cuti',
    to: '/kode-cuti',
    icon: Settings,
    roles: ['Super Admin', 'Admin SKPD', 'Admin Uker'],
  },
  {
    title: 'Manajemen User',
    to: '/manajemen-user',
    icon: UserCog,
    roles: ['Super Admin'],
  },
]

const roleVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Super Admin': 'destructive',
  'Admin SKPD': 'default',
  'Admin Uker': 'default',
  Pegawai: 'secondary',
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const role = user?.role

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role))

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

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">E-Cuti</span>
            <span className="text-xs text-muted-foreground">Kab. Tabalong</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) =>
                item.children ? (
                  <CollapsibleNavItem
                    key={item.to}
                    item={item}
                    currentPath={currentPath}
                    role={role}
                  />
                ) : (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.to === '/'
                          ? currentPath === '/'
                          : currentPath.startsWith(item.to)
                      }
                    >
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/20">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold">
              {user?.pegawai_nama}
            </span>
            {role && (
              <Badge
                variant={roleVariant[role] ?? 'secondary'}
                className="mt-0.5 w-fit text-[10px] px-1.5 py-0"
              >
                {role}
              </Badge>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function CollapsibleNavItem({
  item,
  currentPath,
  role,
}: {
  item: NavItem
  currentPath: string
  role: UserRole | undefined
}) {
  const isChildActive = item.children?.some((child) =>
    currentPath.startsWith(child.to),
  )

  const visibleChildren = item.children?.filter(
    (child) => role && child.roles.includes(role),
  )

  return (
    <Collapsible defaultOpen={isChildActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isChildActive}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {visibleChildren?.map((child) => (
              <SidebarMenuSubItem key={child.to}>
                <SidebarMenuSubButton
                  asChild
                  isActive={currentPath === child.to}
                >
                  <Link to={child.to}>{child.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
