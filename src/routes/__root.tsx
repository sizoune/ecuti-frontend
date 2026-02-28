import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "#/components/theme-provider";
import { Toaster } from "#/components/ui/sonner";
import { TooltipProvider } from "#/components/ui/tooltip";

import "../styles.css";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<Outlet />
				<Toaster richColors position="top-right" />
			</TooltipProvider>
		</ThemeProvider>
	);
}
