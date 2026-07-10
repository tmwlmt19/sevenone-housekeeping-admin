import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type {
  HotelCreate,
  HotelProvisionRequest,
  HotelUpdate,
} from '@/lib/api/types'
import { unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

export function useHotels() {
  return useQuery({
    queryKey: qk.hotels(),
    queryFn: async () => unwrap(await api.GET('/api/v1/hotels')),
  })
}

export function useHotel(hotelId: string) {
  return useQuery({
    queryKey: qk.hotel(hotelId),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/hotels/{hotel_id}', {
          params: { path: { hotel_id: hotelId } },
        }),
      ),
  })
}

export function useCreateHotel() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: HotelCreate) =>
      unwrap(await api.POST('/api/v1/hotels', { body })),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.hotels() }),
  })
}

export function useProvisionHotel() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: HotelProvisionRequest) =>
      unwrap(await api.POST('/api/v1/hotels/provision', { body })),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.hotels() }),
  })
}

export function useUpdateHotel(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: HotelUpdate) =>
      unwrap(
        await api.PUT('/api/v1/hotels/{hotel_id}', {
          params: { path: { hotel_id: hotelId } },
          body,
        }),
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.hotel(hotelId) })
      client.invalidateQueries({ queryKey: qk.hotels() })
    },
  })
}
