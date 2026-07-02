import { Plus } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError } from '@/lib/api/unwrap'
import { useHotels } from '@/lib/queries/hotels'

export function HotelsPage() {
  const { data: hotels, isLoading, isError, error } = useHotels()
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Hotels"
        description="All hotels on the platform."
        action={
          <Button asChild>
            <Link to="/hotels/new">
              <Plus className="size-4" />
              New hotel
            </Link>
          </Button>
        }
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={2}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={2} className="text-destructive">
                  {error instanceof ApiError
                    ? error.message
                    : 'Failed to load hotels'}
                </TableCell>
              </TableRow>
            )}

            {hotels && hotels.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-muted-foreground py-8 text-center"
                >
                  No hotels yet. Create your first hotel to get started.
                </TableCell>
              </TableRow>
            )}

            {hotels?.map((hotel) => (
              <TableRow
                key={hotel.id}
                className="cursor-pointer"
                onClick={() => navigate(`/hotels/${hotel.id}`)}
              >
                <TableCell className="font-medium">{hotel.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {hotel.address ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Outlet />
    </div>
  )
}
