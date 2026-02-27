import { useQuery } from '@tanstack/react-query'
import api from '#/lib/api'
import type {
  LaporanDashboardItem,
  LaporanUsulanItem,
  LaporanRekapItem,
  BukuCutiItem,
} from '#/types'

export function useLaporanDashboard(tahun?: number) {
  return useQuery({
    queryKey: ['laporan', 'dashboard', tahun],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tahun) params.set('tahun', String(tahun))
      const { data } = await api.get<LaporanDashboardItem[]>(
        `/laporan/dashboard?${params}`,
      )
      return data
    },
  })
}

interface CutiBulananFilters {
  tahun?: number
  bulan?: number
  skpd_id?: number
}

export function useLaporanCutiBulanan(filters: CutiBulananFilters) {
  return useQuery({
    queryKey: ['laporan', 'cuti-bulanan', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      }
      const { data } = await api.get<LaporanUsulanItem[]>(
        `/laporan/cuti-bulanan?${params}`,
      )
      return data
    },
    enabled: !!filters.tahun && !!filters.bulan,
  })
}

interface RekapitulasiFilters {
  tahun?: number
  skpd_id?: number
}

export function useLaporanRekapitulasi(filters: RekapitulasiFilters) {
  return useQuery({
    queryKey: ['laporan', 'rekapitulasi', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      }
      const { data } = await api.get<LaporanRekapItem[]>(
        `/laporan/rekapitulasi?${params}`,
      )
      return data
    },
    enabled: !!filters.tahun,
  })
}

export function useBukuCuti(pegawaiId?: number, tahun?: number) {
  return useQuery({
    queryKey: ['laporan', 'buku-cuti', pegawaiId, tahun],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (tahun) params.set('tahun', String(tahun))
      const { data } = await api.get<BukuCutiItem[]>(
        `/laporan/buku/${pegawaiId}?${params}`,
      )
      return data
    },
    enabled: !!pegawaiId,
  })
}
