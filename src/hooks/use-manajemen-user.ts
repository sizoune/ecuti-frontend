import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "#/lib/api";
import type {
	AssignRoleRequest,
	PaginatedResponse,
	UserRoleAssignment,
	UserRoleFilters,
} from "#/types";

export function useUserRoleList(filters: UserRoleFilters = {}) {
	return useQuery({
		queryKey: ["manajemen-user", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.set(key, String(value));
				}
			}
			const { data } = await api.get<PaginatedResponse<UserRoleAssignment>>(
				`/manajemen-user?${params}`,
			);
			return data;
		},
	});
}

export function useAssignRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: AssignRoleRequest) => {
			const { data } = await api.post<{ pegawai_id: number; role_id: number }>(
				"/manajemen-user",
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["manajemen-user"] });
		},
	});
}

export function useRemoveRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			pegawaiId,
			roleId,
		}: {
			pegawaiId: number;
			roleId: number;
		}) => {
			const { data } = await api.delete<{ affected: number }>(
				`/manajemen-user/${pegawaiId}/${roleId}`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["manajemen-user"] });
		},
	});
}
