import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import type { RoomStatus, UserRole } from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import { useHotelStaff } from '@/lib/queries/hotel-users'
import { useHotel, useUpdateHotel } from '@/lib/queries/hotels'
import { useHotelRooms } from '@/lib/queries/rooms'

type HotelForm = { name: string; address: string }

export function HotelDetailPage() {
  const { t } = useTranslation()
  const { hotelId = '' } = useParams()
  const { data: hotel, isLoading } = useHotel(hotelId)
  const updateHotel = useUpdateHotel(hotelId)
  const { data: staff } = useHotelStaff(hotelId)
  const { data: rooms } = useHotelRooms(hotelId)

  const hotelSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('hotelDetail.validation.required'))
          .max(255, t('hotelDetail.validation.max255')),
        address: z.string(),
      }),
    [t],
  )

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
        onSuccess: () => toast.success(t('hotelDetail.hotelUpdated')),
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : t('common.updateFailed'),
          ),
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
          {t('hotelDetail.allHotels')}
        </Link>
        <PageHeader title={hotel?.name ?? t('hotelDetail.hotelFallback')} />
      </div>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('hotelDetail.details')}</h2>
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
                  label={t('hotelDetail.name')}
                  htmlFor="name"
                  error={form.formState.errors.name?.message}
                >
                  <Input id="name" {...form.register('name')} />
                </Field>
                <Field label={t('hotelDetail.address')} htmlFor="address">
                  <Input id="address" {...form.register('address')} />
                </Field>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateHotel.isPending}>
                    {updateHotel.isPending
                      ? t('common.saving')
                      : t('hotelDetail.saveChanges')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('hotelDetail.staff')}</h2>
          <span className="text-muted-foreground text-xs">
            {t('hotelDetail.managedViaRequests')}
          </span>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('hotelDetail.name')}</TableHead>
                <TableHead>{t('hotelDetail.email')}</TableHead>
                <TableHead>{t('hotelDetail.role')}</TableHead>
                <TableHead className="w-24 text-right">
                  {t('common.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff && staff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t('hotelDetail.noStaff')}
                  </TableCell>
                </TableRow>
              )}
              {staff?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`enums.role.${member.role as UserRole}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label={t('common.edit')}
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
          <h2 className="text-sm font-semibold">{t('hotelDetail.rooms')}</h2>
          <span className="text-muted-foreground text-xs">
            {t('hotelDetail.managedViaRequests')}
          </span>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('hotelDetail.room')}</TableHead>
                <TableHead>{t('hotelDetail.floor')}</TableHead>
                <TableHead>{t('hotelDetail.type')}</TableHead>
                <TableHead>{t('hotelDetail.status')}</TableHead>
                <TableHead className="w-24 text-right">
                  {t('common.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms && rooms.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center"
                  >
                    {t('hotelDetail.noRooms')}
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
                      {t(`enums.roomStatus.${room.status as RoomStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      aria-label={t('common.edit')}
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
