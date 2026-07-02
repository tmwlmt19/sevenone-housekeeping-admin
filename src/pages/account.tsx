import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/form/field'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/unwrap'
import { useChangePassword } from '@/lib/queries/account'

const schema = z
  .object({
    current_password: z.string().min(1, 'Required'),
    new_password: z.string().min(8, 'Min 8 characters'),
    confirm_password: z.string().min(1, 'Required'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

export function AccountPage() {
  const changePassword = useChangePassword()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  function onSubmit(values: FormValues) {
    changePassword.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          toast.success('Password changed')
          form.reset()
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 400) {
            form.setError('current_password', { message: e.message })
          } else {
            toast.error(e instanceof ApiError ? e.message : 'Update failed')
          }
        },
      },
    )
  }

  return (
    <div className="max-w-md">
      <Link
        to="/hotels"
        className="text-muted-foreground mb-2 inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <PageHeader title="Account" />
      <Card>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold">Change password</h2>
            <Field
              label="Current password"
              htmlFor="current_password"
              error={form.formState.errors.current_password?.message}
            >
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...form.register('current_password')}
              />
            </Field>
            <Field
              label="New password"
              htmlFor="new_password"
              error={form.formState.errors.new_password?.message}
            >
              <Input
                id="new_password"
                type="password"
                autoComplete="new-password"
                {...form.register('new_password')}
              />
            </Field>
            <Field
              label="Confirm new password"
              htmlFor="confirm_password"
              error={form.formState.errors.confirm_password?.message}
            >
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...form.register('confirm_password')}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Saving…' : 'Change password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
