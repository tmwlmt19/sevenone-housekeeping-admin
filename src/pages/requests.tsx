import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  UserRole,
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

/** A human summary of what the request will do. Resolves the target's name for
 * removes by reading the hotel's staff/rooms (React Query dedupes across rows). */
function useRequestSummary(req: AccessRequest): string {
  const { t } = useTranslation()
  const isStaffRemove = req.resource === 'staff' && req.kind === 'remove'
  const isRoomRemove = req.resource === 'room' && req.kind === 'remove'
  const { data: staff } = useHotelStaff(isStaffRemove ? req.hotel_id : '')
  const { data: rooms } = useHotelRooms(isRoomRemove ? req.hotel_id : '')

  if (req.kind === 'add') {
    if (req.resource === 'staff') {
      const p = req.payload as unknown as StaffAddPayload | null
      return p
        ? `${p.name} · ${p.email} · ${t(`enums.role.${p.role as UserRole}`)}`
        : t('requests.newStaff')
    }
    const p = req.payload as unknown as RoomAddPayload | null
    return p
      ? `${t('requests.room', { number: p.room_number })}${p.room_type ? ` · ${p.room_type}` : ''}`
      : t('requests.newRoom')
  }
  // remove
  if (isStaffRemove) {
    const target = staff?.find((s) => s.id === req.target_id)
    return target
      ? `${target.name} · ${target.email}`
      : t('requests.staffMember')
  }
  const target = rooms?.find((r) => r.id === req.target_id)
  return target
    ? t('requests.room', { number: target.room_number })
    : t('requests.roomWord')
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
  const { t } = useTranslation()
  const summary = useRequestSummary(req)
  const approve = useApproveRequest()

  function handleApprove() {
    approve.mutate(req.id, {
      onSuccess: (decision) => {
        if (decision.temporary_password) {
          // Surfaced once; the admin hands it to the new user.
          toast.success(t('requests.staffAdded'), {
            description: t('requests.tempPasswordDesc', {
              password: decision.temporary_password,
            }),
            duration: Infinity,
            closeButton: true,
          })
        } else {
          toast.success(t('requests.requestApproved'))
        }
      },
      onError: (e) =>
        toast.error(
          e instanceof ApiError ? e.message : t('requests.approveFailed'),
        ),
    })
  }

  const kindVariant = req.kind === 'remove' ? 'destructive' : 'default'

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant={kindVariant}>
              {t('requests.kindResource', {
                kind: t(`enums.requestKind.${req.kind}`),
                resource: t(`enums.resource.${req.resource}`),
              })}
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
            {t('requests.reject')}
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={approve.isPending}
          >
            <Check className="size-4" />
            {approve.isPending
              ? t('requests.approving')
              : t('requests.approve')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function RequestsPage() {
  const { t } = useTranslation()
  const { data: requests, isLoading } = useAccessRequests('pending')
  const { data: hotels } = useHotels()
  const reject = useRejectRequest()
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null)
  const [note, setNote] = useState('')

  const hotelName = (id: string) =>
    hotels?.find((h) => h.id === id)?.name ?? t('requests.unknownHotel')

  function submitReject() {
    if (!rejecting) return
    reject.mutate(
      { requestId: rejecting.id, decisionNote: note.trim() },
      {
        onSuccess: () => {
          toast.success(t('requests.requestRejected'))
          setRejecting(null)
          setNote('')
        },
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : t('requests.rejectFailed'),
          ),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('requests.title')} />

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            {t('requests.noPending')}
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
            <DialogTitle>{t('requests.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('requests.rejectDescription')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('requests.reasonPlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejecting(null)}
              disabled={reject.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={reject.isPending}
            >
              {reject.isPending
                ? t('requests.rejecting')
                : t('requests.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
