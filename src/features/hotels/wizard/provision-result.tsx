import { CheckCircle2, Copy, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { downloadText } from '@/lib/csv'

export interface ProvisionOutcome {
  hotelId: string
  hotelName: string
  roomsCreated: number
  users: { email: string; name: string; role: string }[]
  temporaryPassword: string
}

export function ProvisionResult({ outcome }: { outcome: ProvisionOutcome }) {
  const { hotelName, roomsCreated, users, temporaryPassword } = outcome

  function copyPassword() {
    navigator.clipboard
      .writeText(temporaryPassword)
      .then(() => toast.success('Temporary password copied'))
      .catch(() => toast.error("Couldn't copy to clipboard"))
  }

  function downloadCredentials() {
    const header = 'name,email,role,temporary_password\n'
    const body = users
      .map(
        (u) =>
          `${csv(u.name)},${csv(u.email)},${u.role},${csv(temporaryPassword)}`,
      )
      .join('\n')
    downloadText(`${slug(hotelName)}-credentials.csv`, header + body + '\n')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Hotel created"
        description={`${hotelName} is ready.`}
      />

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-primary size-6" />
            <div className="text-sm">
              Imported <strong>{roomsCreated}</strong> room
              {roomsCreated === 1 ? '' : 's'} and{' '}
              <strong>{users.length}</strong> staff member
              {users.length === 1 ? '' : 's'}.
            </div>
          </div>

          {users.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="bg-muted/40 rounded-md border p-4">
                <p className="mb-1 text-sm font-medium">
                  Shared temporary password
                </p>
                <p className="text-muted-foreground mb-3 text-sm">
                  Give this to the new staff. They must change it on first
                  sign-in. It won't be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-background rounded border px-3 py-1.5 font-mono text-sm">
                    {temporaryPassword}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyPassword}>
                    <Copy className="size-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCredentials}
                  >
                    <Download className="size-4" />
                    Download credentials CSV
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/hotels/${outcome.hotelId}`}>Go to hotel</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/hotels">Back to hotels</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Minimal CSV cell escaping for values that may contain commas/quotes. */
function csv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'hotel'
  )
}
