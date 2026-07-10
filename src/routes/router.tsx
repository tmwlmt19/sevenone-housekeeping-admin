import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { HotelUserFormModal } from '@/features/hotels/hotel-user-form-modal'
import { ProvisionWizard } from '@/features/hotels/wizard/provision-wizard'
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
          // Standalone multi-step wizard (must precede the ":hotelId" match).
          { path: 'hotels/new', element: <ProvisionWizard /> },
          { path: 'hotels', element: <HotelsPage /> },
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
