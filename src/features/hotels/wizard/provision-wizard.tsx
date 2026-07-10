import { Check, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
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
} from '@/lib/csv'
import { cn } from '@/lib/utils'
import { useProvisionHotel } from '@/lib/queries/hotels'

import { ImportStep, type ColumnDef } from './import-step'
import { ProvisionResult, type ProvisionOutcome } from './provision-result'

const STEPS = ['Details', 'Rooms', 'Staff', 'Review'] as const

function humanize(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const ROOM_COLUMNS: ColumnDef<RoomDraft>[] = [
  { key: 'room_number', label: 'Room number', placeholder: '101' },
  { key: 'floor', label: 'Floor', placeholder: '1' },
  { key: 'room_type', label: 'Type', placeholder: 'STD' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: ROOM_STATUSES,
    optionLabel: humanize,
  },
]

const STAFF_COLUMNS: ColumnDef<StaffDraft>[] = [
  { key: 'name', label: 'Name', placeholder: 'Jane Doe' },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: ['manager', 'housekeeper'],
    optionLabel: humanize,
  },
]

export function ProvisionWizard() {
  const navigate = useNavigate()
  const provision = useProvisionHotel()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [rooms, setRooms] = useState<RoomDraft[]>([])
  const [staff, setStaff] = useState<StaffDraft[]>([])
  const [serverErrors, setServerErrors] = useState<RowError[]>([])
  const [outcome, setOutcome] = useState<ProvisionOutcome | null>(null)

  const roomErrors = useMemo(() => validateRooms(rooms), [rooms])
  const staffErrors = useMemo(() => validateStaff(staff), [staff])
  const nameError = name.trim() === '' ? 'A hotel name is required' : undefined

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
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
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
          toast.success('Hotel created')
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
            e instanceof ApiError ? e.message : 'Something went wrong',
          )
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New hotel"
        description="Set up a hotel and optionally import its rooms and staff."
        action={
          <Button variant="ghost" onClick={() => navigate('/hotels')}>
            Cancel
          </Button>
        }
      />

      <Stepper current={step} />

      <Card className="mt-6">
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Field label="Hotel name" htmlFor="name" error={nameError}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seaside Resort"
                />
              </Field>
              <Field label="Address" htmlFor="address">
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Ocean Ave"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <ImportStep
              noun="room"
              columns={ROOM_COLUMNS}
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
              noun="staff member"
              columns={STAFF_COLUMNS}
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
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button onClick={submit} disabled={!canSubmit || provision.isPending}>
            {provision.isPending ? 'Creating…' : 'Create hotel'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
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
              {label}
            </span>
            {i < STEPS.length - 1 && (
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
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-muted-foreground">Hotel</dt>
        <dd className="font-medium">{name.trim() || '—'}</dd>
        <dt className="text-muted-foreground">Address</dt>
        <dd>{address.trim() || '—'}</dd>
        <dt className="text-muted-foreground">Rooms to import</dt>
        <dd>{roomCount}</dd>
        <dt className="text-muted-foreground">Staff to import</dt>
        <dd>{staffCount}</dd>
      </dl>

      <p className="text-muted-foreground text-sm">
        All staff receive one shared temporary password (shown after creation)
        and must set their own on first sign-in.
      </p>

      {clientErrorCount > 0 && (
        <p className="text-destructive text-sm">
          {clientErrorCount} row(s) still have errors. Go back and fix them —
          the whole import is all-or-nothing.
        </p>
      )}

      {serverErrors.length > 0 && (
        <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3">
          <p className="text-destructive mb-2 text-sm font-medium">
            The server rejected this import. Nothing was created:
          </p>
          <ul className="text-destructive list-disc space-y-1 pl-5 text-sm">
            {serverErrors.map((e, i) => (
              <li key={i}>
                {e.sheet} row {e.row + 1}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
