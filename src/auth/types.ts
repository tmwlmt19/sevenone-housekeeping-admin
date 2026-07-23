import type { Language, Theme } from '@/lib/api/types'

// Mirrors the backend UserRole enum (admin | manager | housekeeper).
export type Role = 'admin' | 'manager' | 'front_desk' | 'housekeeper'

export interface AuthUser {
  id: string
  // Null for platform/service admins, who belong to no hotel.
  hotelId: string | null
  role: Role
  theme: Theme
  preferredLanguage: Language
}
