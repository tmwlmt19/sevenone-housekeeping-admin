import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
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
  HOTEL_ROLES,
  type StaffCreate,
  type StaffUpdate,
} from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import {
  useCreateHotelUser,
  useHotelStaff,
  useUpdateHotelUser,
} from '@/lib/queries/hotel-users'

function label(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function makeSchema(isEdit: boolean) {
  return z.object({
    email: z.string().trim().email('Enter a valid email'),
    name: z.string().trim().min(1, 'Required').max(255, 'Max 255 characters'),
    role: z.enum(['manager', 'housekeeper']),
    password: isEdit ? z.string() : z.string().min(8, 'Min 8 characters'),
  })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>

export function HotelUserFormModal() {
  const { hotelId = '', userId } = useParams()
  const isEdit = Boolean(userId)
  const navigate = useNavigate()
  const backTo = `/hotels/${hotelId}`

  const { data: staff } = useHotelStaff(hotelId)
  const member = userId ? staff?.find((m) => m.id === userId) : undefined

  const createUser = useCreateHotelUser(hotelId)
  const updateUser = useUpdateHotelUser(hotelId)
  const isPending = createUser.isPending || updateUser.isPending

  const schema = useMemo(() => makeSchema(isEdit), [isEdit])
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', role: 'manager', password: '' },
  })

  useEffect(() => {
    if (member) {
      form.reset({
        email: member.email,
        name: member.name,
        role: member.role === 'housekeeper' ? 'housekeeper' : 'manager',
        password: '',
      })
    }
  }, [member, form])

  if (isEdit && staff && !member) {
    return (
      <RouteModal title="Staff member not found" backTo={backTo}>
        <p className="text-muted-foreground text-sm">
          This person no longer exists.
        </p>
      </RouteModal>
    )
  }

  function onSubmit(values: FormValues) {
    const handlers = {
      onSuccess: () => {
        toast.success(isEdit ? 'Staff updated' : 'Staff added')
        navigate(backTo)
      },
      onError: (e: unknown) => {
        if (e instanceof ApiError && e.status === 409) {
          form.setError('email', { message: e.message })
        } else {
          toast.error(
            e instanceof ApiError ? e.message : 'Something went wrong',
          )
        }
      },
    }

    if (isEdit && userId) {
      const body: StaffUpdate = {
        email: values.email,
        name: values.name,
        role: values.role,
      }
      updateUser.mutate({ userId, body }, handlers)
    } else {
      const body: StaffCreate = {
        email: values.email,
        name: values.name,
        role: values.role,
        password: values.password,
      }
      createUser.mutate(body, handlers)
    }
  }

  return (
    <RouteModal
      title={isEdit ? 'Edit staff member' : 'Add staff member'}
      backTo={backTo}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <Field
          label="Name"
          htmlFor="name"
          error={form.formState.errors.name?.message}
        >
          <Input id="name" {...form.register('name')} />
        </Field>
        <Field
          label="Email"
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input id="email" type="email" {...form.register('email')} />
        </Field>
        <Field label="Role" error={form.formState.errors.role?.message}>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOTEL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {label(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {!isEdit && (
          <Field
            label="Temporary password"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            <p className="text-muted-foreground text-sm">
              The user changes this on their account page after signing in.
            </p>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backTo)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </RouteModal>
  )
}
