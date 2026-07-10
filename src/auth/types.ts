// Mirrors the backend UserRole enum (admin | manager | housekeeper).
export type Role = 'admin' | 'manager' | 'housekeeper'

export interface AuthUser {
  id: string
  // Null for platform/service admins, who belong to no hotel.
  hotelId: string | null
  role: Role
}
