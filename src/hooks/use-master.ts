import { useQuery } from '@tanstack/react-query'
import api from '#/lib/api'
import type { Eselon, Golongan, Jabatan, JenisCuti, Skpd, Subunit } from '#/types'

export function useSkpdList() {
  return useQuery({
    queryKey: ['master', 'skpd'],
    queryFn: async () => {
      const { data } = await api.get<Skpd[]>('/master/skpd')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useSubunitList(skpdId?: number) {
  return useQuery({
    queryKey: ['master', 'subunit', skpdId],
    queryFn: async () => {
      const params = skpdId ? `?skpd_id=${skpdId}` : ''
      const { data } = await api.get<Subunit[]>(`/master/subunit${params}`)
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useJenisCutiList() {
  return useQuery({
    queryKey: ['master', 'jenis-cuti'],
    queryFn: async () => {
      const { data } = await api.get<JenisCuti[]>('/master/jenis-cuti')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useGolonganList() {
  return useQuery({
    queryKey: ['master', 'golongan'],
    queryFn: async () => {
      const { data } = await api.get<Golongan[]>('/master/golongan')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useJabatanList() {
  return useQuery({
    queryKey: ['master', 'jabatan'],
    queryFn: async () => {
      const { data } = await api.get<Jabatan[]>('/master/jabatan')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useEselonList() {
  return useQuery({
    queryKey: ['master', 'eselon'],
    queryFn: async () => {
      const { data } = await api.get<Eselon[]>('/master/eselon')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}
