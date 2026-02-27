import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <TooltipProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
