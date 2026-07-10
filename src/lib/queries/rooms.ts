import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type { RoomUpdate } from '@/lib/api/types'
import { unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

export function useHotelRooms(hotelId: string) {
  return useQuery({
    queryKey: qk.hotelRooms(hotelId),
    enabled: Boolean(hotelId),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/hotels/{hotel_id}/rooms', {
          params: { path: { hotel_id: hotelId } },
        }),
      ),
  })
}

export function useUpdateRoom(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({
      roomId,
      body,
    }: {
      roomId: string
      body: RoomUpdate
    }) =>
      unwrap(
        await api.PUT('/api/v1/hotels/{hotel_id}/rooms/{room_id}', {
          params: { path: { hotel_id: hotelId, room_id: roomId } },
          body,
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelRooms(hotelId) }),
  })
}
