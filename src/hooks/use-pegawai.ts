import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api'
import type { Pegawai, PaginatedResponse, PegawaiFilters, UpdateProfileRequest } from '#/types'

export function usePegawaiList(filters: PegawaiFilters = {}) {
  return useQuery({
    queryKey: ['pegawai', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      }
      const { data } = await api.get<PaginatedResponse<Pegawai>>(`/pegawai?${params}`)
      return data
    },
  })
}

export function usePegawaiSearch(search: string) {
  return useQuery({
    queryKey: ['pegawai', 'search', search],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Pegawai>>(
        `/pegawai?search=${encodeURIComponent(search)}&limit=20`,
      )
      return data
    },
    enabled: search.length >= 3,
  })
}

export function usePegawaiDetail(id: number) {
  return useQuery({
    queryKey: ['pegawai', id],
    queryFn: async () => {
      const { data } = await api.get<Pegawai>(`/pegawai/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function usePegawaiProfile() {
  return useQuery({
    queryKey: ['pegawai-profile'],
    queryFn: async () => {
      const { data } = await api.get<Pegawai>('/pegawai/profile')
      return data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateProfileRequest) => {
      const { data } = await api.patch<Pegawai>('/pegawai/profile', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pegawai-profile'] })
    },
  })
}
