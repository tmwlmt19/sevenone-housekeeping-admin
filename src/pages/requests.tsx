import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type {
  AccessRequest,
  RoomAddPayload,
  StaffAddPayload,
} from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import {
  useApproveRequest,
  useAccessRequests,
  useRejectRequest,
} from '@/lib/queries/access-requests'
import { useHotels } from '@/lib/queries/hotels'
import { useHotelRooms } from '@/lib/queries/rooms'
import { useHotelStaff } from '@/lib/queries/hotel-users'

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** A human summary of what the request will do. Resolves the target's name for
 * removes by reading the hotel's staff/rooms (React Query dedupes across rows). */
function useRequestSummary(req: AccessRequest): string {
  const isStaffRemove = req.resource === 'staff' && req.kind === 'remove'
  const isRoomRemove = req.resource === 'room' && req.kind === 'remove'
  const { data: staff } = useHotelStaff(isStaffRemove ? req.hotel_id : '')
  const { data: rooms } = useHotelRooms(isRoomRemove ? req.hotel_id : '')

  if (req.kind === 'add') {
    if (req.resource === 'staff') {
      const p = req.payload as unknown as StaffAddPayload | null
      return p ? `${p.name} · ${p.email} · ${titleCase(p.role)}` : 'New staff'
    }
    const p = req.payload as unknown as RoomAddPayload | null
    return p
      ? `Room ${p.room_number}${p.room_type ? ` · ${p.room_type}` : ''}`
      : 'New room'
  }
  // remove
  if (isStaffRemove) {
    const target = staff?.find((s) => s.id === req.target_id)
    return target ? `${target.name} · ${target.email}` : 'Staff member'
  }
  const target = rooms?.find((r) => r.id === req.target_id)
  return target ? `Room ${target.room_number}` : 'Room'
}

function RequestCard({
  req,
  hotelName,
  onReject,
}: {
  req: AccessRequest
  hotelName: string
  onReject: (req: AccessRequest) => void
}) {
  const summary = useRequestSummary(req)
  const approve = useApproveRequest()

  function handleApprove() {
    approve.mutate(req.id, {
      onSuccess: (decision) => {
        if (decision.temporary_password) {
          // Surfaced once; the admin hands it to the new user.
          toast.success('Staff added', {
            description: `Temporary password: ${decision.temporary_password}`,
            duration: Infinity,
            closeButton: true,
          })
        } else {
          toast.success('Request approved')
        }
      },
      onError: (e) =>
        toast.error(e instanceof ApiError ? e.message : 'Approve failed'),
    })
  }

  const kindVariant = req.kind === 'remove' ? 'destructive' : 'default'

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={kindVariant}>
              {titleCase(req.kind)} {req.resource}
            </Badge>
            <span className="text-muted-foreground text-sm">{hotelName}</span>
          </div>
          <div className="font-medium">{summary}</div>
          {req.note && (
            <div className="text-muted-foreground text-sm">“{req.note}”</div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(req)}
            disabled={approve.isPending}
          >
            <X className="size-4" />
            Reject
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={approve.isPending}>
            <Check className="size-4" />
            {approve.isPending ? 'Approving…' : 'Approve'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function RequestsPage() {
  const { data: requests, isLoading } = useAccessRequests('pending')
  const { data: hotels } = useHotels()
  const reject = useRejectRequest()
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null)
  const [note, setNote] = useState('')

  const hotelName = (id: string) =>
    hotels?.find((h) => h.id === id)?.name ?? 'Unknown hotel'

  function submitReject() {
    if (!rejecting) return
    reject.mutate(
      { requestId: rejecting.id, decisionNote: note.trim() },
      {
        onSuccess: () => {
          toast.success('Request rejected')
          setRejecting(null)
          setNote('')
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : 'Reject failed'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Requests" />

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            No pending requests.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              hotelName={hotelName(req.hotel_id)}
              onReject={setRejecting}
            />
          ))}
        </div>
      )}

      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejecting(null)
            setNote('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Optionally tell the manager why. This closes the request without
              making any change.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejecting(null)}
              disabled={reject.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={reject.isPending}
            >
              {reject.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
