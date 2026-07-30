import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type { ApiKeyCreate } from '@/lib/api/types'
import { ensureOk, unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

export function useHotelApiKeys(hotelId: string) {
  return useQuery({
    queryKey: qk.hotelApiKeys(hotelId),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/hotels/{hotel_id}/api-keys', {
          params: { path: { hotel_id: hotelId } },
        }),
      ),
  })
}

export function useCreateApiKey(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (body: ApiKeyCreate) =>
      unwrap(
        await api.POST('/api/v1/hotels/{hotel_id}/api-keys', {
          params: { path: { hotel_id: hotelId } },
          body,
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelApiKeys(hotelId) }),
  })
}

export function useRevokeApiKey(hotelId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (keyId: string) =>
      ensureOk(
        await api.DELETE('/api/v1/hotels/{hotel_id}/api-keys/{key_id}', {
          params: { path: { hotel_id: hotelId, key_id: keyId } },
        }),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.hotelApiKeys(hotelId) }),
  })
}
