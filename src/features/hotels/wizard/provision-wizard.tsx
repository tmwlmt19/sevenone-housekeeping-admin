import { Check, ChevronLeft } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Field } from '@/components/form/field'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ROOM_STATUSES } from '@/lib/api/types'
import { ApiError, type RowError } from '@/lib/api/unwrap'
import {
  EMPTY_ROOM,
  EMPTY_STAFF,
  parseRoomsCsv,
  parseStaffCsv,
  roomsToPayload,
  ROOMS_TEMPLATE,
  STAFF_TEMPLATE,
  staffToPayload,
  validateRooms,
  validateStaff,
  type RoomDraft,
  type StaffDraft,
  type Translate,
} from '@/lib/csv'
import { cn } from '@/lib/utils'
import { useProvisionHotel } from '@/lib/queries/hotels'

import { ImportStep, type ColumnDef } from './import-step'
import { ProvisionResult, type ProvisionOutcome } from './provision-result'

const STEP_KEYS = ['details', 'rooms', 'staff', 'review'] as const

export function ProvisionWizard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const provision = useProvisionHotel()

  // Adapt i18next's typed `t` to the loose translator csv.ts expects.
  const tr: Translate = useCallback(
    (key, opts) => t(key as never, opts as never) as unknown as string,
    [t],
  )

  const roomColumns: ColumnDef<RoomDraft>[] = useMemo(
    () => [
      {
        key: 'room_number',
        label: t('wizard.import.columns.roomNumber'),
        placeholder: '101',
      },
      {
        key: 'floor',
        label: t('wizard.import.columns.floor'),
        placeholder: '1',
      },
      {
        key: 'room_type',
        label: t('wizard.import.columns.type'),
        placeholder: 'STD',
      },
      {
        key: 'status',
        label: t('wizard.import.columns.status'),
        type: 'select',
        options: ROOM_STATUSES,
        optionLabel: (v) =>
          t(`enums.roomStatus.${v as (typeof ROOM_STATUSES)[number]}`),
      },
    ],
    [t],
  )

  const staffColumns: ColumnDef<StaffDraft>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('wizard.import.columns.name'),
        placeholder: 'Jane Doe',
      },
      {
        key: 'email',
        label: t('wizard.import.columns.email'),
        placeholder: 'jane@example.com',
      },
      {
        key: 'role',
        label: t('wizard.import.columns.role'),
        type: 'select',
        options: ['manager', 'front_desk', 'housekeeper'],
        optionLabel: (v) =>
          t(`enums.role.${v as 'manager' | 'front_desk' | 'housekeeper'}`),
      },
    ],
    [t],
  )

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [rooms, setRooms] = useState<RoomDraft[]>([])
  const [staff, setStaff] = useState<StaffDraft[]>([])
  const [serverErrors, setServerErrors] = useState<RowError[]>([])
  const [outcome, setOutcome] = useState<ProvisionOutcome | null>(null)

  const roomErrors = useMemo(() => validateRooms(rooms, tr), [rooms, tr])
  const staffErrors = useMemo(() => validateStaff(staff, tr), [staff, tr])
  const nameError = name.trim() === '' ? t('wizard.nameRequired') : undefined

  const canSubmit =
    !nameError && roomErrors.size === 0 && staffErrors.size === 0

  if (outcome) {
    return <ProvisionResult outcome={outcome} />
  }

  function next() {
    if (step === 0 && nameError) {
      toast.error(nameError)
      return
    }
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1))
  }

  function submit() {
    setServerErrors([])
    provision.mutate(
      {
        hotel: {
          name: name.trim(),
          address: address.trim() === '' ? null : address.trim(),
        },
        rooms: roomsToPayload(rooms),
        users: staffToPayload(staff),
      },
      {
        onSuccess: (res) => {
          toast.success(t('wizard.hotelCreated'))
          setOutcome({
            hotelId: res.hotel.id,
            hotelName: res.hotel.name,
            roomsCreated: res.rooms_created,
            users: res.users.map((u) => ({
              email: u.email,
              name: u.name,
              role: u.role,
            })),
            temporaryPassword: res.temporary_password,
          })
        },
        onError: (e) => {
          if (e instanceof ApiError && e.rowErrors.length > 0) {
            setServerErrors(e.rowErrors)
          }
          toast.error(
            e instanceof ApiError ? e.message : t('common.somethingWentWrong'),
          )
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t('wizard.title')}
        description={t('wizard.subtitle')}
        action={
          <Button variant="ghost" onClick={() => navigate('/hotels')}>
            {t('common.cancel')}
          </Button>
        }
      />

      <Stepper current={step} />

      <Card className="mt-6">
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Field
                label={t('wizard.hotelName')}
                htmlFor="name"
                error={nameError}
              >
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('wizard.hotelNamePlaceholder')}
                />
              </Field>
              <Field label={t('wizard.address')} htmlFor="address">
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('wizard.addressPlaceholder')}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <ImportStep
              kind="rooms"
              columns={roomColumns}
              rows={rooms}
              errors={roomErrors}
              emptyRow={EMPTY_ROOM}
              onChange={setRooms}
              parseFile={parseRoomsCsv}
              templateCsv={ROOMS_TEMPLATE}
              templateName="rooms-template.csv"
            />
          )}

          {step === 2 && (
            <ImportStep
              kind="staff"
              columns={staffColumns}
              rows={staff}
              errors={staffErrors}
              emptyRow={EMPTY_STAFF}
              onChange={setStaff}
              parseFile={parseStaffCsv}
              templateCsv={STAFF_TEMPLATE}
              templateName="staff-template.csv"
            />
          )}

          {step === 3 && (
            <ReviewStep
              name={name}
              address={address}
              roomCount={rooms.length}
              staffCount={staff.length}
              clientErrorCount={roomErrors.size + staffErrors.size}
              serverErrors={serverErrors}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || provision.isPending}
        >
          <ChevronLeft className="size-4" />
          {t('common.back')}
        </Button>
        {step < STEP_KEYS.length - 1 ? (
          <Button onClick={next}>{t('common.continue')}</Button>
        ) : (
          <Button onClick={submit} disabled={!canSubmit || provision.isPending}>
            {provision.isPending
              ? t('wizard.creating')
              : t('wizard.createHotel')}
          </Button>
        )}
      </div>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  const { t } = useTranslation()
  return (
    <ol className="flex items-center gap-2">
      {STEP_KEYS.map((key, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
                active && 'border-primary bg-primary text-primary-foreground',
                done && 'border-primary bg-primary/10 text-primary',
                !active && !done && 'text-muted-foreground',
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                !active && !done && 'text-muted-foreground',
              )}
            >
              {t(`wizard.steps.${key}`)}
            </span>
            {i < STEP_KEYS.length - 1 && (
              <span className="bg-border mx-1 h-px flex-1" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

interface ReviewStepProps {
  name: string
  address: string
  roomCount: number
  staffCount: number
  clientErrorCount: number
  serverErrors: RowError[]
}

function ReviewStep({
  name,
  address,
  roomCount,
  staffCount,
  clientErrorCount,
  serverErrors,
}: ReviewStepProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">{t('wizard.review.hotel')}</dt>
        <dd className="font-medium">{name.trim() || '—'}</dd>
        <dt className="text-muted-foreground">{t('wizard.review.address')}</dt>
        <dd>{address.trim() || '—'}</dd>
        <dt className="text-muted-foreground">
          {t('wizard.review.roomsToImport')}
        </dt>
        <dd>{roomCount}</dd>
        <dt className="text-muted-foreground">
          {t('wizard.review.staffToImport')}
        </dt>
        <dd>{staffCount}</dd>
      </dl>

      <p className="text-muted-foreground text-sm">
        {t('wizard.review.sharedPasswordNote')}
      </p>

      {clientErrorCount > 0 && (
        <p className="text-destructive text-sm">
          {t('wizard.review.errorsRemain', { count: clientErrorCount })}
        </p>
      )}

      {serverErrors.length > 0 && (
        <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3">
          <p className="text-destructive mb-2 text-sm font-medium">
            {t('wizard.review.serverRejected')}
          </p>
          <ul className="text-destructive list-disc space-y-1 pl-5 text-sm">
            {serverErrors.map((e, i) => (
              <li key={i}>
                {t('wizard.review.serverRow', {
                  sheet: e.sheet,
                  row: e.row + 1,
                  message: e.message,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
