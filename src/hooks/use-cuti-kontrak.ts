import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "#/lib/api";
import type {
	CreateCutiKontrakRequest,
	CutiKontrak,
	CutiKontrakFilters,
	PaginatedResponse,
	UpdateCutiKontrakStatusRequest,
} from "#/types";

export function useCutiKontrakList(filters: CutiKontrakFilters = {}) {
	return useQuery({
		queryKey: ["cuti-kontrak", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null && value !== "") {
					params.set(key, String(value));
				}
			}
			const { data } = await api.get<PaginatedResponse<CutiKontrak>>(
				`/cuti-kontrak?${params}`,
			);
			return data;
		},
	});
}

export function useCutiKontrakDetail(id: number) {
	return useQuery({
		queryKey: ["cuti-kontrak", id],
		queryFn: async () => {
			const { data } = await api.get<CutiKontrak>(`/cuti-kontrak/${id}`);
			return data;
		},
		enabled: !!id,
	});
}

export function useCreateCutiKontrak() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: CreateCutiKontrakRequest) => {
			const { data } = await api.post<{ usulkontrak_id: number }>(
				"/cuti-kontrak",
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-kontrak"] });
		},
	});
}

export function useUpdateCutiKontrakStatus(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: UpdateCutiKontrakStatusRequest) => {
			const { data } = await api.patch<{ affected: number }>(
				`/cuti-kontrak/${id}/status`,
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-kontrak"] });
			queryClient.invalidateQueries({ queryKey: ["cuti-kontrak", id] });
		},
	});
}

export function useCancelCutiKontrak(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await api.patch<{ affected: number }>(
				`/cuti-kontrak/${id}/cancel`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-kontrak"] });
			queryClient.invalidateQueries({ queryKey: ["cuti-kontrak", id] });
		},
	});
}
