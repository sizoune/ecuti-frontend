import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "#/components/layout/app-header";
import { AppSidebar } from "#/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: () => {
		const token = localStorage.getItem("access_token");
		if (!token) {
			throw redirect({ to: "/login" });
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<AppHeader />
				<main className="flex-1 overflow-auto p-4 md:p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
