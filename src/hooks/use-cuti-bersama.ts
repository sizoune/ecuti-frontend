import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api'
import type {
  CutiBersama,
  CreateCutiBersamaRequest,
  CutiBersamaFilters,
  PaginatedResponse,
} from '#/types'

export function useCutiBersamaList(filters: CutiBersamaFilters = {}) {
  return useQuery({
    queryKey: ['cuti-bersama', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      }
      const { data } = await api.get<PaginatedResponse<CutiBersama>>(
        `/cuti-bersama?${params}`,
      )
      return data
    },
  })
}

export function useCreateCutiBersama() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCutiBersamaRequest) => {
      const { data } = await api.post<{ cutibersama_id: number }>(
        '/cuti-bersama',
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti-bersama'] })
    },
  })
}

export function useDeleteCutiBersama() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete<{ affected: number }>(
        `/cuti-bersama/${id}`,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti-bersama'] })
    },
  })
}
