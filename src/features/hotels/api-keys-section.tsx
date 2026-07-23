import { Copy, KeyRound, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ApiKey } from '@/lib/api/types'
import { ApiError } from '@/lib/api/unwrap'
import {
  useCreateApiKey,
  useHotelApiKeys,
  useRevokeApiKey,
} from '@/lib/queries/api-keys'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ApiKeysSection({ hotelId }: { hotelId: string }) {
  const { t } = useTranslation()
  const { data: keys } = useHotelApiKeys(hotelId)
  const createKey = useCreateApiKey(hotelId)
  const revokeKey = useRevokeApiKey(hotelId)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  // The full secret, shown once after creation.
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [toRevoke, setToRevoke] = useState<ApiKey | null>(null)

  function handleCreate() {
    createKey.mutate(
      { name: newName.trim() },
      {
        onSuccess: (res) => {
          setCreatedSecret(res.key)
          setCreating(false)
          setNewName('')
        },
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : t('common.somethingWentWrong'),
          ),
      },
    )
  }

  function handleRevoke() {
    if (!toRevoke) return
    revokeKey.mutate(toRevoke.id, {
      onSuccess: () => {
        toast.success(t('apiKeys.revoked'))
        setToRevoke(null)
      },
      onError: (e) =>
        toast.error(
          e instanceof ApiError ? e.message : t('common.somethingWentWrong'),
        ),
    })
  }

  function copySecret() {
    if (!createdSecret) return
    navigator.clipboard
      .writeText(createdSecret)
      .then(() => toast.success(t('apiKeys.copied')))
      .catch(() => toast.error(t('apiKeys.cantCopy')))
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('apiKeys.title')}</h2>
        <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t('apiKeys.generate')}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t('apiKeys.description')}</p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('apiKeys.name')}</TableHead>
              <TableHead>{t('apiKeys.key')}</TableHead>
              <TableHead>{t('apiKeys.lastUsed')}</TableHead>
              <TableHead>{t('apiKeys.status')}</TableHead>
              <TableHead className="w-24 text-right">
                {t('common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys && keys.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  {t('apiKeys.none')}
                </TableCell>
              </TableRow>
            )}
            {keys?.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-muted-foreground font-mono text-xs">
                    {key.key_prefix}…
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(key.last_used_at)}
                </TableCell>
                <TableCell>
                  {key.revoked_at ? (
                    <Badge variant="secondary">{t('apiKeys.revokedTag')}</Badge>
                  ) : (
                    <Badge>{t('apiKeys.activeTag')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!key.revoked_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToRevoke(key)}
                    >
                      {t('apiKeys.revoke')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Name + generate */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('apiKeys.generateTitle')}</DialogTitle>
            <DialogDescription>{t('apiKeys.generateDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key-name">{t('apiKeys.name')}</Label>
            <Input
              id="api-key-name"
              value={newName}
              placeholder={t('apiKeys.namePlaceholder')}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={newName.trim() === '' || createKey.isPending}
              onClick={handleCreate}
            >
              {createKey.isPending ? t('common.working') : t('apiKeys.generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show the secret once */}
      <Dialog
        open={createdSecret !== null}
        onOpenChange={(open) => !open && setCreatedSecret(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <KeyRound className="mr-2 inline size-4" />
              {t('apiKeys.createdTitle')}
            </DialogTitle>
            <DialogDescription>{t('apiKeys.createdDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 overflow-x-auto rounded border px-3 py-2 font-mono text-xs">
              {createdSecret}
            </code>
            <Button variant="outline" size="sm" onClick={copySecret}>
              <Copy className="size-4" />
              {t('apiKeys.copy')}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedSecret(null)}>
              {t('apiKeys.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title={t('apiKeys.revokeTitle')}
        description={t('apiKeys.revokeDesc', { name: toRevoke?.name ?? '' })}
        confirmLabel={t('apiKeys.revoke')}
        destructive
        loading={revokeKey.isPending}
        onConfirm={handleRevoke}
      />
    </section>
  )
}
