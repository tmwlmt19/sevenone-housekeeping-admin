import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Outlet, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ConfirmDialog } from '@/components/confirm-dialog'
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
import type { Staff } from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import { useDeleteHotelUser, useHotelStaff } from '@/lib/queries/hotel-users'
import { useHotel, useUpdateHotel } from '@/lib/queries/hotels'

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
  const deleteUser = useDeleteHotelUser(hotelId)
  const [toDelete, setToDelete] = useState<Staff | null>(null)

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

  function handleDelete() {
    if (!toDelete) return
    deleteUser.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(`${toDelete.name} removed`)
        setToDelete(null)
      },
      onError: (e) =>
        toast.error(e instanceof ApiError ? e.message : 'Failed to remove'),
    })
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
          <Button asChild size="sm">
            <Link to={`/hotels/${hotelId}/staff/new`}>
              <Plus className="size-4" />
              Add staff
            </Link>
          </Button>
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
                    No staff yet. Add the hotel's first manager.
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete"
                      onClick={() => setToDelete(member)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove staff member?"
        description={
          toDelete ? `${toDelete.name} will lose access to this hotel.` : ''
        }
        confirmLabel="Remove"
        destructive
        loading={deleteUser.isPending}
        onConfirm={handleDelete}
      />

      {/* Route-aware add/edit staff modal renders here. */}
      <Outlet />
    </div>
  )
}
