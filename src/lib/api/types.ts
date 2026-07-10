// Convenience aliases over the generated OpenAPI component schemas.
import type { components } from './schema'

type Schemas = components['schemas']

export type Hotel = Schemas['HotelRead']
export type HotelCreate = Schemas['HotelCreate']
export type HotelUpdate = Schemas['HotelUpdate']

export type Staff = Schemas['UserRead']
export type StaffCreate = Schemas['UserCreate']
export type StaffUpdate = Schemas['UserUpdate']
export type UserRole = Schemas['UserRole']

export type RoomCreate = Schemas['RoomCreate']
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

// Hotel-staff roles the admin can assign (admin is a platform role, not a hotel one).
export const HOTEL_ROLES: UserRole[] = ['manager', 'housekeeper']
