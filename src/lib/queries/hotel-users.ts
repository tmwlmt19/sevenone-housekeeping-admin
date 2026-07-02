import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type { StaffCreate, StaffUpdate } from '@/lib/api/types'
import { ensureOk, unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

export function useHotelStaff(hotelId: string) {
  return useQuery({
    queryKey: qk.hotelStaff(hotelId),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/hotels/{hotel_id}/users', {
          params: { path: { hotel_id: hotelId } },
        }),
      ),
  })
}

export function useCreateHotelUser(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: StaffCreate) =>
      unwrap(
        await api.POST('/api/v1/hotels/{hotel_id}/users', {
          params: { path: { hotel_id: hotelId } },
          body,
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelStaff(hotelId) }),
  })
}

export function useUpdateHotelUser(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      body,
    }: {
      userId: string
      body: StaffUpdate
    }) =>
      unwrap(
        await api.PUT('/api/v1/hotels/{hotel_id}/users/{user_id}', {
          params: { path: { hotel_id: hotelId, user_id: userId } },
          body,
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelStaff(hotelId) }),
  })
}

export function useDeleteHotelUser(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      ensureOk(
        await api.DELETE('/api/v1/hotels/{hotel_id}/users/{user_id}', {
          params: { path: { hotel_id: hotelId, user_id: userId } },
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelStaff(hotelId) }),
  })
}
