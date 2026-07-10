import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Outlet, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/form/field'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROOM_STATUS_LABELS } from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import { useHotelStaff } from '@/lib/queries/hotel-users'
import { useHotel, useUpdateHotel } from '@/lib/queries/hotels'
import { useHotelRooms } from '@/lib/queries/rooms'

const hotelSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(255, 'Max 255 characters'),
  address: z.string(),
})

type HotelForm = z.infer<typeof hotelSchema>

function label(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function HotelDetailPage() {
  const { hotelId = '' } = useParams()
  const { data: hotel, isLoading } = useHotel(hotelId)
  const updateHotel = useUpdateHotel(hotelId)
  const { data: staff } = useHotelStaff(hotelId)
  const { data: rooms } = useHotelRooms(hotelId)

  const form = useForm<HotelForm>({
    resolver: zodResolver(hotelSchema),
    defaultValues: { name: '', address: '' },
  })

  useEffect(() => {
    if (hotel) form.reset({ name: hotel.name, address: hotel.address ?? '' })
  }, [hotel, form])

  function onSaveHotel(values: HotelForm) {
    updateHotel.mutate(
      {
        name: values.name,
        address: values.address.trim() === '' ? null : values.address,
      },
      {
        onSuccess: () => toast.success('Hotel updated'),
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : 'Update failed'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          to="/hotels"
          className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm hover:underline"
        >
          <ArrowLeft className="size-4" />
          All hotels
        </Link>
        <PageHeader title={hotel?.name ?? 'Hotel'} />
      </div>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="text-sm font-semibold">Details</h2>
        <Card>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <form
                onSubmit={form.handleSubmit(onSaveHotel)}
                className="flex flex-col gap-4"
              >
                <Field
                  label="Name"
                  htmlFor="name"
                  error={form.formState.errors.name?.message}
                >
                  <Input id="name" {...form.register('name')} />
                </Field>
                <Field label="Address" htmlFor="address">
                  <Input id="address" {...form.register('address')} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateHotel.isPending}>
                    {updateHotel.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Staff</h2>
          <span className="text-muted-foreground text-xs">
            Adds &amp; removals come from managers via Requests
          </span>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff && staff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No staff yet.
                  </TableCell>
                </TableRow>
              )}
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{label(member.role)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label="Edit"
                    >
                      <Link to={`/hotels/${hotelId}/staff/${member.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Rooms</h2>
          <span className="text-muted-foreground text-xs">
            Adds &amp; removals come from managers via Requests
          </span>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms && rooms.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No rooms yet.
                  </TableCell>
                </TableRow>
              )}
              {rooms?.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    {room.room_number}
                  </TableCell>
                  <TableCell>{room.floor ?? '—'}</TableCell>
                  <TableCell>{room.room_type ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROOM_STATUS_LABELS[room.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label="Edit"
                    >
                      <Link to={`/hotels/${hotelId}/rooms/${room.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Route-aware edit staff & room modals render here. */}
      <Outlet />
    </div>
  )
}
