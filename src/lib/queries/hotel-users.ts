import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type { StaffUpdate } from '@/lib/api/types'
import { unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

export function useHotelStaff(hotelId: string) {
  return useQuery({
    queryKey: qk.hotelStaff(hotelId),
    enabled: Boolean(hotelId),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/hotels/{hotel_id}/users', {
          params: { path: { hotel_id: hotelId } },
        }),
      ),
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
