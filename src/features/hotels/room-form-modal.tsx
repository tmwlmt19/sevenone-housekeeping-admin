import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/form/field'
import { RouteModal } from '@/components/route-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ROOM_STATUS_LABELS,
  ROOM_STATUSES,
  type RoomUpdate,
} from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import { useHotelRooms, useUpdateRoom } from '@/lib/queries/rooms'

// Editing an existing room is still an admin-direct action. Adding and removing
// rooms go through the manager → admin Requests queue instead.
const schema = z.object({
  room_number: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(50, 'Max 50 characters'),
  floor: z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d+$/.test(v), 'Whole number'),
  room_type: z.string().trim().max(20, 'Max 20 characters'),
  status: z.enum(['clean', 'dirty', 'in_progress', 'out_of_service']),
})

type FormValues = z.infer<typeof schema>

export function RoomFormModal() {
  const { hotelId = '', roomId = '' } = useParams()
  const navigate = useNavigate()
  const backTo = `/hotels/${hotelId}`

  const { data: rooms } = useHotelRooms(hotelId)
  const room = rooms?.find((r) => r.id === roomId)

  const updateRoom = useUpdateRoom(hotelId)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_number: '',
      floor: '',
      room_type: '',
      status: 'clean',
    },
  })

  useEffect(() => {
    if (room) {
      form.reset({
        room_number: room.room_number,
        floor: room.floor === null ? '' : String(room.floor),
        room_type: room.room_type ?? '',
        status: room.status,
      })
    }
  }, [room, form])

  if (rooms && !room) {
    return (
      <RouteModal title="Room not found" backTo={backTo}>
        <p className="text-muted-foreground text-sm">
          This room no longer exists.
        </p>
      </RouteModal>
    )
  }

  function onSubmit(values: FormValues) {
    const body: RoomUpdate = {
      room_number: values.room_number,
      floor: values.floor === '' ? null : Number(values.floor),
      room_type: values.room_type === '' ? null : values.room_type,
      status: values.status,
    }
    updateRoom.mutate(
      { roomId, body },
      {
        onSuccess: () => {
          toast.success('Room updated')
          navigate(backTo)
        },
        onError: (e: unknown) => {
          if (e instanceof ApiError && e.status === 409) {
            form.setError('room_number', { message: e.message })
          } else {
            toast.error(
              e instanceof ApiError ? e.message : 'Something went wrong',
            )
          }
        },
      },
    )
  }

  return (
    <RouteModal title="Edit room" backTo={backTo}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <Field
          label="Room number"
          htmlFor="room_number"
          error={form.formState.errors.room_number?.message}
        >
          <Input id="room_number" {...form.register('room_number')} />
        </Field>
        <Field
          label="Floor"
          htmlFor="floor"
          error={form.formState.errors.floor?.message}
        >
          <Input
            id="floor"
            inputMode="numeric"
            placeholder="Optional"
            {...form.register('floor')}
          />
        </Field>
        <Field
          label="Room type"
          htmlFor="room_type"
          error={form.formState.errors.room_type?.message}
        >
          <Input
            id="room_type"
            placeholder="Optional (e.g. STD, DLX)"
            {...form.register('room_type')}
          />
        </Field>
        <Field label="Status" error={form.formState.errors.status?.message}>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ROOM_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backTo)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateRoom.isPending}>
            {updateRoom.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </RouteModal>
  )
}
