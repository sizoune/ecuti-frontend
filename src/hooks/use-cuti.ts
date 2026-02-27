import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api'
import type {
  CreateCutiRequest,
  Cuti,
  CutiBalance,
  CutiFilters,
  CutiStatistics,
  PaginatedResponse,
  UpdateCutiStatusRequest,
} from '#/types'

export function useCutiList(filters: CutiFilters = {}) {
  return useQuery({
    queryKey: ['cuti', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      }
      const { data } = await api.get<PaginatedResponse<Cuti>>(`/cuti?${params}`)
      return data
    },
  })
}

export function useCutiDetail(id: number) {
  return useQuery({
    queryKey: ['cuti', id],
    queryFn: async () => {
      const { data } = await api.get<Cuti>(`/cuti/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCutiBalance(pegawaiId?: number, tahun?: number) {
  const path = pegawaiId ? `/cuti/balance/${pegawaiId}` : '/cuti/balance'
  return useQuery({
    queryKey: ['cuti-balance', pegawaiId, tahun],
    queryFn: async () => {
      const params = tahun ? `?tahun=${tahun}` : ''
      const { data } = await api.get<CutiBalance[]>(`${path}${params}`)
      return data
    },
  })
}

export function useCutiStatistics(skpdId?: number, tahun?: number, enabled = true) {
  return useQuery({
    queryKey: ['cuti-statistics', skpdId, tahun],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (skpdId) params.set('skpd_id', String(skpdId))
      if (tahun) params.set('tahun', String(tahun))
      const { data } = await api.get<CutiStatistics>(`/cuti/statistics?${params}`)
      return data
    },
    enabled,
  })
}

export function useCreateCuti() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCutiRequest) => {
      const { data } = await api.post<Cuti>('/cuti', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti'] })
      queryClient.invalidateQueries({ queryKey: ['cuti-balance'] })
    },
  })
}

export function useUpdateCutiStatus(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateCutiStatusRequest) => {
      const { data } = await api.patch<Cuti>(`/cuti/${id}/status`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti'] })
      queryClient.invalidateQueries({ queryKey: ['cuti', id] })
      queryClient.invalidateQueries({ queryKey: ['cuti-statistics'] })
    },
  })
}

export function useCancelCuti(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<Cuti>(`/cuti/${id}/cancel`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti'] })
      queryClient.invalidateQueries({ queryKey: ['cuti', id] })
      queryClient.invalidateQueries({ queryKey: ['cuti-balance'] })
    },
  })
}
