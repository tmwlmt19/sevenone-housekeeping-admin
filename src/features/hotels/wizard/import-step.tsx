import { Download, Plus, Trash2, Upload } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { toast } from 'sonner'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RowErrors } from '@/lib/csv'
import { downloadText } from '@/lib/csv'

export interface ColumnDef<T> {
  key: keyof T & string
  label: string
  type?: 'text' | 'select'
  options?: readonly string[]
  optionLabel?: (value: string) => string
  placeholder?: string
}

interface ImportStepProps<T> {
  /** Human label for a row, e.g. "room" / "staff member". */
  noun: string
  columns: ColumnDef<T>[]
  rows: T[]
  errors: Map<number, RowErrors>
  emptyRow: T
  onChange: (rows: T[]) => void
  parseFile: (file: File) => Promise<T[]>
  templateCsv: string
  templateName: string
  children?: ReactNode
}

export function ImportStep<T>({
  noun,
  columns,
  rows,
  errors,
  emptyRow,
  onChange,
  parseFile,
  templateCsv,
  templateName,
  children,
}: ImportStepProps<T>) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      const parsed = await parseFile(file)
      if (parsed.length === 0) {
        toast.error('No rows found in that file.')
        return
      }
      // Append to any rows already entered, so uploads and manual entry combine.
      onChange([...rows, ...parsed])
      toast.success(`Loaded ${parsed.length} ${noun}${plural(parsed.length)}`)
    } catch {
      toast.error("Couldn't read that file. Is it a valid CSV?")
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function updateCell(rowIndex: number, key: keyof T, value: string) {
    onChange(
      rows.map((r, i) =>
        i === rowIndex ? ({ ...r, [key]: value } as T) : r,
      ),
    )
  }

  function removeRow(rowIndex: number) {
    onChange(rows.filter((_, i) => i !== rowIndex))
  }

  const errorCount = errors.size

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => downloadText(templateName, templateCsv)}
        >
          <Download className="size-4" />
          Download template
        </Button>
        <div className="text-muted-foreground ml-auto text-sm">
          {rows.length} {noun}
          {plural(rows.length)}
          {errorCount > 0 && (
            <span className="text-destructive">
              {' '}
              · {errorCount} with errors
            </span>
          )}
        </div>
      </div>

      {children}

      {rows.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed py-10 text-center text-sm">
          No {noun}s yet. Upload a CSV or add rows manually — this step is
          optional.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const rowErr = errors.get(i)
                return (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.key} className="align-top">
                        {c.type === 'select' ? (
                          <Select
                            value={row[c.key] as string}
                            onValueChange={(v) => updateCell(i, c.key, v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(c.options ?? []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {c.optionLabel ? c.optionLabel(opt) : opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={row[c.key] as string}
                            placeholder={c.placeholder}
                            onChange={(e) =>
                              updateCell(i, c.key, e.target.value)
                            }
                            aria-invalid={Boolean(rowErr?.[c.key])}
                          />
                        )}
                        {rowErr?.[c.key] && (
                          <p className="text-destructive mt-1 text-xs">
                            {rowErr[c.key]}
                          </p>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(i)}
                        aria-label={`Remove ${noun}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rows, { ...emptyRow }])}
        >
          <Plus className="size-4" />
          Add {noun}
        </Button>
      </div>
    </div>
  )
}

function plural(n: number): string {
  return n === 1 ? '' : 's'
}
