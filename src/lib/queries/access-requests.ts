import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import type { AccessRequestDecision, RequestStatus } from '@/lib/api/types'
import { unwrap } from '@/lib/api/unwrap'

import { qk } from './keys'

/** The global queue across all hotels. Defaults to pending. */
export function useAccessRequests(status: RequestStatus = 'pending') {
  return useQuery({
    queryKey: qk.accessRequests(status),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/access-requests', {
          params: { query: { status } },
        }),
      ),
  })
}

function useInvalidateRequests() {
  const client = useQueryClient()
  return () =>
    client.invalidateQueries({ queryKey: ['access-requests'] })
}

export function useApproveRequest() {
  const invalidate = useInvalidateRequests()
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string): Promise<AccessRequestDecision> =>
      unwrap(
        await api.POST('/api/v1/access-requests/{request_id}/approve', {
          params: { path: { request_id: requestId } },
        }),
      ),
    onSuccess: (decision) => {
      invalidate()
      // The approve performed an add/remove, so the hotel's staff/rooms changed.
      client.invalidateQueries({
        queryKey: qk.hotelStaff(decision.request.hotel_id),
      })
      client.invalidateQueries({
        queryKey: qk.hotelRooms(decision.request.hotel_id),
      })
    },
  })
}

export function useRejectRequest() {
  const invalidate = useInvalidateRequests()
  return useMutation({
    mutationFn: async ({
      requestId,
      decisionNote,
    }: {
      requestId: string
      decisionNote: string
    }) =>
      unwrap(
        await api.POST('/api/v1/access-requests/{request_id}/reject', {
          params: { path: { request_id: requestId } },
          body: { decision_note: decisionNote },
        }),
      ),
    onSuccess: invalidate,
  })
}
