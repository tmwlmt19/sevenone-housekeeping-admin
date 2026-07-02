import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { CreateHotelModal } from '@/features/hotels/create-hotel-modal'
import { HotelUserFormModal } from '@/features/hotels/hotel-user-form-modal'
import { AccountPage } from '@/pages/account'
import { HotelDetailPage } from '@/pages/hotel-detail'
import { HotelsPage } from '@/pages/hotels'
import { NotFoundPage } from '@/pages/not-found'

import { RequireAuth } from './guards'

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/hotels" replace /> },
          {
            path: 'hotels',
            element: <HotelsPage />,
            children: [{ path: 'new', element: <CreateHotelModal /> }],
          },
          {
            path: 'hotels/:hotelId',
            element: <HotelDetailPage />,
            children: [
              { path: 'staff/new', element: <HotelUserFormModal /> },
              { path: 'staff/:userId', element: <HotelUserFormModal /> },
            ],
          },
          { path: 'account', element: <AccountPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
