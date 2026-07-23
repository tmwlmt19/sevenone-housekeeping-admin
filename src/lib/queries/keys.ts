// Query keys for the admin (cross-tenant) console.
export const qk = {
  hotels: () => ['hotels'] as const,
  hotel: (hotelId: string) => ['hotel', hotelId] as const,
  hotelStaff: (hotelId: string) => ['hotel-staff', hotelId] as const,
  hotelRooms: (hotelId: string) => ['hotel-rooms', hotelId] as const,
  hotelApiKeys: (hotelId: string) => ['hotel-api-keys', hotelId] as const,
  accessRequests: (status?: string) => ['access-requests', status ?? 'all'] as const,
}
