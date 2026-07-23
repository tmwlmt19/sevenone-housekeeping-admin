import Papa from 'papaparse'

import type { RoomCreate, RoomStatus, UserProvision } from '@/lib/api/types'
import { ROOM_STATUSES } from '@/lib/api/types'

// Editable draft rows held in wizard state (all strings, for form inputs).
export interface RoomDraft {
  room_number: string
  floor: string
  room_type: string
  status: RoomStatus
}

export interface StaffDraft {
  email: string
  name: string
  role: 'manager' | 'front_desk' | 'housekeeper'
}

export const EMPTY_ROOM: RoomDraft = {
  room_number: '',
  floor: '',
  room_type: '',
  status: 'clean',
}

export const EMPTY_STAFF: StaffDraft = {
  email: '',
  name: '',
  role: 'housekeeper',
}

/** Field-level errors for a single draft row, keyed by field name. */
export type RowErrors = Partial<Record<string, string>>

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

/** Map a parsed CSV row's headers onto our known aliases (case/space tolerant). */
function pick(row: Record<string, string>, aliases: string[]): string {
  const normalized: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    normalized[normalizeKey(k)] = typeof v === 'string' ? v.trim() : ''
  }
  for (const alias of aliases) {
    if (alias in normalized) return normalized[alias]
  }
  return ''
}

function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (result) => resolve(result.data),
      error: (err: Error) => reject(err),
    })
  })
}

export async function parseRoomsCsv(file: File): Promise<RoomDraft[]> {
  const rows = await parseCsvFile(file)
  return rows.map((row) => {
    const status = normalizeKey(pick(row, ['status'])) as RoomStatus
    return {
      room_number: pick(row, ['room_number', 'number', 'room', 'room_no']),
      floor: pick(row, ['floor', 'level']),
      room_type: pick(row, ['room_type', 'type']),
      status: ROOM_STATUSES.includes(status) ? status : 'clean',
    }
  })
}

export async function parseStaffCsv(file: File): Promise<StaffDraft[]> {
  const rows = await parseCsvFile(file)
  return rows.map((row) => {
    const role = normalizeKey(pick(row, ['role']))
    return {
      email: pick(row, ['email', 'e_mail']),
      name: pick(row, ['name', 'full_name']),
      role:
        role === 'manager' || role === 'front_desk' ? role : 'housekeeper',
    }
  })
}

// --- Validation (mirrors the backend rules; the server stays authoritative) ---

// A minimal translator signature so this module doesn't depend on i18next types.
// Callers pass i18next's `t` bound to the `wizard.csv.*` keys.
export type Translate = (key: string, opts?: Record<string, unknown>) => string

export function validateRooms(
  rooms: RoomDraft[],
  t: Translate,
): Map<number, RowErrors> {
  const errors = new Map<number, RowErrors>()
  const seen = new Map<string, number>()
  rooms.forEach((room, i) => {
    const e: RowErrors = {}
    const num = room.room_number.trim()
    if (!num) e.room_number = t('wizard.csv.required')
    else if (num.length > 50) e.room_number = t('wizard.csv.max50')
    else if (seen.has(num))
      e.room_number = t('wizard.csv.duplicateOfRow', {
        row: seen.get(num)! + 1,
      })
    else seen.set(num, i)

    if (room.floor.trim() && !/^-?\d+$/.test(room.floor.trim()))
      e.floor = t('wizard.csv.wholeNumber')
    if (room.room_type.trim().length > 20) e.room_type = t('wizard.csv.max20')
    if (Object.keys(e).length) errors.set(i, e)
  })
  return errors
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateStaff(
  staff: StaffDraft[],
  t: Translate,
): Map<number, RowErrors> {
  const errors = new Map<number, RowErrors>()
  const seen = new Map<string, number>()
  staff.forEach((member, i) => {
    const e: RowErrors = {}
    const email = member.email.trim().toLowerCase()
    if (!member.email.trim()) e.email = t('wizard.csv.required')
    else if (!EMAIL_RE.test(member.email.trim()))
      e.email = t('wizard.csv.invalidEmail')
    else if (seen.has(email))
      e.email = t('wizard.csv.duplicateOfRow', { row: seen.get(email)! + 1 })
    else seen.set(email, i)

    if (!member.name.trim()) e.name = t('wizard.csv.required')
    else if (member.name.trim().length > 255) e.name = t('wizard.csv.max255')
    if (Object.keys(e).length) errors.set(i, e)
  })
  return errors
}

// --- Mapping drafts to the provisioning request payload ---

export function roomsToPayload(rooms: RoomDraft[]): RoomCreate[] {
  return rooms.map((r) => ({
    room_number: r.room_number.trim(),
    floor: r.floor.trim() === '' ? null : Number(r.floor.trim()),
    room_type: r.room_type.trim() === '' ? null : r.room_type.trim(),
    status: r.status,
  }))
}

export function staffToPayload(staff: StaffDraft[]): UserProvision[] {
  return staff.map((s) => ({
    email: s.email.trim(),
    name: s.name.trim(),
    role: s.role,
  }))
}

// --- Templates & downloads ---

export const ROOMS_TEMPLATE =
  'room_number,floor,room_type,status\n101,1,STD,clean\n'
export const STAFF_TEMPLATE =
  'email,name,role\njane@example.com,Jane Doe,manager\n'

export function downloadText(
  filename: string,
  text: string,
  mime = 'text/csv',
): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
