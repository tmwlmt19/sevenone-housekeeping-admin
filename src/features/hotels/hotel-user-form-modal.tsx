import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { HOTEL_ROLES, type StaffUpdate } from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import { useHotelStaff, useUpdateHotelUser } from '@/lib/queries/hotel-users'

type FormValues = {
  email: string
  name: string
  role: 'manager' | 'housekeeper'
}

export function HotelUserFormModal() {
  const { t } = useTranslation()
  const { hotelId = '', userId = '' } = useParams()
  const navigate = useNavigate()
  const backTo = `/hotels/${hotelId}`

  const { data: staff } = useHotelStaff(hotelId)
  const member = staff?.find((m) => m.id === userId)

  const updateUser = useUpdateHotelUser(hotelId)

  // Editing an existing staff member is still an admin-direct action. Adding and
  // removing staff go through the manager → admin Requests queue instead.
  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .email(t('hotelUserForm.validation.validEmail')),
        name: z
          .string()
          .trim()
          .min(1, t('hotelUserForm.validation.required'))
          .max(255, t('hotelUserForm.validation.max255')),
        role: z.enum(['manager', 'housekeeper']),
      }),
    [t],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', name: '', role: 'manager' },
  })

  useEffect(() => {
    if (member) {
      form.reset({
        email: member.email,
        name: member.name,
        role: member.role === 'housekeeper' ? 'housekeeper' : 'manager',
      })
    }
  }, [member, form])

  if (staff && !member) {
    return (
      <RouteModal title={t('hotelUserForm.notFoundTitle')} backTo={backTo}>
        <p className="text-muted-foreground text-sm">
          {t('hotelUserForm.notFoundBody')}
        </p>
      </RouteModal>
    )
  }

  function onSubmit(values: FormValues) {
    const body: StaffUpdate = {
      email: values.email,
      name: values.name,
      role: values.role,
    }
    updateUser.mutate(
      { userId, body },
      {
        onSuccess: () => {
          toast.success(t('hotelUserForm.staffUpdated'))
          navigate(backTo)
        },
        onError: (e: unknown) => {
          if (e instanceof ApiError && e.status === 409) {
            form.setError('email', { message: e.message })
          } else {
            toast.error(
              e instanceof ApiError
                ? e.message
                : t('common.somethingWentWrong'),
            )
          }
        },
      },
    )
  }

  return (
    <RouteModal title={t('hotelUserForm.editTitle')} backTo={backTo}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <Field
          label={t('hotelUserForm.name')}
          htmlFor="name"
          error={form.formState.errors.name?.message}
        >
          <Input id="name" {...form.register('name')} />
        </Field>
        <Field
          label={t('hotelUserForm.email')}
          htmlFor="email"
          error={form.formState.errors.email?.message}
        >
          <Input id="email" type="email" {...form.register('email')} />
        </Field>
        <Field
          label={t('hotelUserForm.role')}
          error={form.formState.errors.role?.message}
        >
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
                      {t(`enums.role.${r}`)}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            {updateUser.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </RouteModal>
  )
}
