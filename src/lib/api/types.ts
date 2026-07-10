// Convenience aliases over the generated OpenAPI component schemas.
import type { components } from './schema'

type Schemas = components['schemas']

export type Hotel = Schemas['HotelRead']
export type HotelCreate = Schemas['HotelCreate']
export type HotelUpdate = Schemas['HotelUpdate']

export type Staff = Schemas['UserRead']
export type StaffUpdate = Schemas['UserUpdate']
export type UserRole = Schemas['UserRole']

// UI preferences (persisted per-user).
export type Theme = Schemas['Theme']
export type Language = Schemas['Language']

export type Room = Schemas['RoomRead']
export type RoomCreate = Schemas['RoomCreate']
export type RoomUpdate = Schemas['RoomUpdate']
export type RoomStatus = Schemas['RoomStatus']
export type UserProvision = Schemas['UserProvision']
export type HotelProvisionRequest = Schemas['HotelProvisionRequest']
export type HotelProvisionResponse = Schemas['HotelProvisionResponse']

export const ROOM_STATUSES: RoomStatus[] = [
  'clean',
  'dirty',
  'in_progress',
  'out_of_service',
]

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: 'Clean',
  dirty: 'Dirty',
  in_progress: 'In progress',
  out_of_service: 'Out of service',
}

// Hotel-staff roles the admin can assign (admin is a platform role, not a hotel one).
export const HOTEL_ROLES: UserRole[] = ['manager', 'housekeeper']

// --- Access requests (manager → admin approval queue) ---
export type AccessRequest = Schemas['AccessRequestRead']
export type AccessRequestDecision = Schemas['AccessRequestDecision']
export type RequestResource = Schemas['RequestResource']
export type RequestKind = Schemas['RequestKind']
export type RequestStatus = Schemas['RequestStatus']

// The payload column is free-form jsonb in the schema; these are the concrete
// shapes we store for each add request.
export type StaffAddPayload = Schemas['StaffAddPayload']
export type RoomAddPayload = Schemas['RoomAddPayload']
