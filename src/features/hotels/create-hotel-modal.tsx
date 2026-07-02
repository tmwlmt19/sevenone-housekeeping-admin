import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/form/field'
import { RouteModal } from '@/components/route-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/unwrap'
import { useCreateHotel } from '@/lib/queries/hotels'

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(255, 'Max 255 characters'),
  address: z.string(),
})

type FormValues = z.infer<typeof schema>

export function CreateHotelModal() {
  const navigate = useNavigate()
  const createHotel = useCreateHotel()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '' },
  })

  function onSubmit(values: FormValues) {
    createHotel.mutate(
      {
        name: values.name,
        address: values.address.trim() === '' ? null : values.address,
      },
      {
        onSuccess: (hotel) => {
          toast.success('Hotel created')
          // Jump into the new hotel so its first manager can be added.
          navigate(`/hotels/${hotel.id}`)
        },
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : 'Something went wrong',
          ),
      },
    )
  }

  return (
    <RouteModal title="New hotel" backTo="/hotels">
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
        <Field label="Address" htmlFor="address">
          <Input id="address" {...form.register('address')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/hotels')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createHotel.isPending}>
            {createHotel.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </RouteModal>
  )
}
