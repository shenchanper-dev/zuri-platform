import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DispatchTripForm } from '@/components/dashboard/dispatch-trip-form';

const trips = [
    { id: 'TRP001', client: 'John Doe', driver: 'Carlos Villa', status: 'Completed', amount: 25.50 },
    { id: 'TRP002', client: 'Jane Smith', driver: 'Ana Torres', status: 'In Progress', amount: 32.00 },
    { id: 'TRP003', client: 'Peter Jones', driver: 'Luis Ramos', status: 'Scheduled', amount: 18.75 },
    { id: 'TRP004', client: 'Mary Johnson', driver: 'Ana Torres', status: 'Completed', amount: 45.10 },
    { id: 'TRP005', client: 'David Williams', driver: 'Carlos Villa', status: 'Canceled', amount: 0 },
];

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'Completed': 'default',
    'In Progress': 'secondary',
    'Scheduled': 'outline',
    'Canceled': 'destructive',
};
const statusBadgeClass: Record<string, string> = {
    'Completed': 'bg-green-600/20 text-green-700 border-green-600/30',
};


export default function TripsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Viajes</h1>
        <DispatchTripForm />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Viajes Recientes</CardTitle>
            <CardDescription>Un resumen de los viajes recientes en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Viaje</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.id}</TableCell>
                  <TableCell>{trip.client}</TableCell>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[trip.status]} className={statusBadgeClass[trip.status] || ''}>
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${trip.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
