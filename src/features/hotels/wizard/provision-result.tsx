import { CheckCircle2, Copy, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { UserRole } from '@/lib/api/types'
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
  const { t } = useTranslation()
  const { hotelName, roomsCreated, users, temporaryPassword } = outcome

  function copyPassword() {
    navigator.clipboard
      .writeText(temporaryPassword)
      .then(() => toast.success(t('provisionResult.passwordCopied')))
      .catch(() => toast.error(t('provisionResult.cantCopy')))
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
        title={t('provisionResult.title')}
        description={t('provisionResult.subtitle', { hotel: hotelName })}
      />

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-primary size-6" />
            <div className="text-sm">
              {t('provisionResult.importedSummary', {
                rooms: t('provisionResult.roomsCount', { count: roomsCreated }),
                staff: t('provisionResult.staffCount', { count: users.length }),
              })}
            </div>
          </div>

          {users.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="bg-muted/40 rounded-md border p-4">
                <p className="mb-1 text-sm font-medium">
                  {t('provisionResult.sharedPassword')}
                </p>
                <p className="text-muted-foreground mb-3 text-sm">
                  {t('provisionResult.sharedPasswordDesc')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-background rounded border px-3 py-1.5 font-mono text-sm">
                    {temporaryPassword}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyPassword}>
                    <Copy className="size-4" />
                    {t('provisionResult.copy')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCredentials}
                  >
                    <Download className="size-4" />
                    {t('provisionResult.downloadCsv')}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('provisionResult.name')}</TableHead>
                      <TableHead>{t('provisionResult.email')}</TableHead>
                      <TableHead>{t('provisionResult.role')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.email}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          {t(`enums.role.${u.role as UserRole}`)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/hotels/${outcome.hotelId}`}>
                {t('provisionResult.goToHotel')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/hotels">{t('provisionResult.backToHotels')}</Link>
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
