import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "#/lib/api";
import type {
	CreateCutiBersamaRequest,
	CutiBersama,
	CutiBersamaFilters,
	PaginatedResponse,
} from "#/types";

export function useUploadCutiBersamaFile(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const { data } = await api.post<{ message: string }>(
				`/cuti-bersama/${id}/file`,
				formData,
				{ headers: { "Content-Type": "multipart/form-data" } },
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-bersama"] });
		},
	});
}

export function useCutiBersamaFileUrl(id: number, enabled = true) {
	return useQuery({
		queryKey: ["cuti-bersama", id, "file"],
		queryFn: async () => {
			const { data } = await api.get<{ url: string }>(
				`/cuti-bersama/${id}/file`,
			);
			return data;
		},
		enabled,
	});
}

export function useCutiBersamaList(filters: CutiBersamaFilters = {}) {
	return useQuery({
		queryKey: ["cuti-bersama", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(filters)) {
				if (value !== undefined && value !== null) {
					params.set(key, String(value));
				}
			}
			const { data } = await api.get<PaginatedResponse<CutiBersama>>(
				`/cuti-bersama?${params}`,
			);
			return data;
		},
	});
}

export function useCreateCutiBersama() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: CreateCutiBersamaRequest) => {
			const { data } = await api.post<{ cutibersama_id: number }>(
				"/cuti-bersama",
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-bersama"] });
		},
	});
}

export function useDeleteCutiBersama() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: number) => {
			const { data } = await api.delete<{ affected: number }>(
				`/cuti-bersama/${id}`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cuti-bersama"] });
		},
	});
}
