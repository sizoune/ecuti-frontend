import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "#/lib/api";
import type {
	CreateKodeCutiRequest,
	KodeCuti,
	UpdateKodeCutiRequest,
} from "#/types";

export function useKodeCutiList(skpdId?: number) {
	return useQuery({
		queryKey: ["kode-cuti", skpdId],
		queryFn: async () => {
			const params = skpdId ? `?skpd_id=${skpdId}` : "";
			const { data } = await api.get<KodeCuti[]>(`/kode-cuti${params}`);
			return data;
		},
	});
}

export function useCreateKodeCuti() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: CreateKodeCutiRequest) => {
			const { data } = await api.post<{ kode_id: number }>(
				"/kode-cuti",
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kode-cuti"] });
		},
	});
}

export function useUpdateKodeCuti(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: UpdateKodeCutiRequest) => {
			const { data } = await api.patch<{ affected: number }>(
				`/kode-cuti/${id}`,
				payload,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kode-cuti"] });
		},
	});
}

export function useDeleteKodeCuti() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: number) => {
			const { data } = await api.delete<{ affected: number }>(
				`/kode-cuti/${id}`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["kode-cuti"] });
		},
	});
}
