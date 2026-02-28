import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api'
import type {
  CreateCutiRequest,
  Cuti,
  CutiBalance,
  CutiBalanceEntry,
  CutiFilters,
  CutiStatistics,
  CutiStatisticsResponse,
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
      const { data } = await api.get<CutiBalanceEntry[]>(`${path}${params}`)
      return aggregateBalance(data)
    },
  })
}

function aggregateBalance(entries: CutiBalanceEntry[]): CutiBalance[] {
  const map = new Map<number, { nama: string; terpakai: number }>()
  for (const entry of entries) {
    const lama = Number(entry.bukucuti_lama) || 0
    const existing = map.get(entry.jeniscuti_id)
    if (existing) {
      existing.terpakai += lama
    } else {
      map.set(entry.jeniscuti_id, {
        nama: entry.jeniscuti_nama,
        terpakai: lama,
      })
    }
  }
  return Array.from(map.entries()).map(([id, { nama, terpakai }]) => ({
    jeniscuti_id: id,
    jeniscuti_nama: nama,
    terpakai,
  }))
}

export function useCutiStatistics(skpdId?: number, tahun?: number, enabled = true) {
  return useQuery({
    queryKey: ['cuti-statistics', skpdId, tahun],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (skpdId) params.set('skpd_id', String(skpdId))
      if (tahun) params.set('tahun', String(tahun))
      const { data } = await api.get<CutiStatisticsResponse>(`/cuti/statistics?${params}`)

      const statusMap = new Map<string, number>()
      for (const item of data.byStatus) {
        statusMap.set(item.status, Number(item.jumlah) || 0)
      }

      return {
        total_pengajuan: Array.from(statusMap.values()).reduce((a, b) => a + b, 0),
        total_disetujui: statusMap.get('Terima') ?? 0,
        total_ditolak: statusMap.get('Ditolak') ?? 0,
        total_proses: statusMap.get('Proses') ?? 0,
        total_batal: statusMap.get('Batal') ?? 0,
        by_jenis: data.byJenis.map((j) => ({
          jeniscuti_nama: j.jeniscuti_nama,
          jeniscuti_kode: j.jeniscuti_kode,
          total: Number(j.jumlah) || 0,
        })),
      } satisfies CutiStatistics
    },
    enabled,
  })
}

export function useCreateCuti() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCutiRequest) => {
      const { data } = await api.post<{ usulcuti_id: number }>('/cuti', payload)
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
      const { data } = await api.patch<{ affected: number }>(`/cuti/${id}/status`, payload)
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
      const { data } = await api.patch<{ affected: number }>(`/cuti/${id}/cancel`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuti'] })
      queryClient.invalidateQueries({ queryKey: ['cuti', id] })
      queryClient.invalidateQueries({ queryKey: ['cuti-balance'] })
    },
  })
}
