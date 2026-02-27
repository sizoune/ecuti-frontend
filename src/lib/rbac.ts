import type { UserRole } from '#/types'

export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  return !!userRole && allowedRoles.includes(userRole)
}

export function isAdmin(role: UserRole | undefined): boolean {
  return hasRole(role, ['Super Admin', 'Admin SKPD', 'Admin Uker'])
}

export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === 'Super Admin'
}

export function isAdminSKPD(role: UserRole | undefined): boolean {
  return role === 'Admin SKPD'
}
