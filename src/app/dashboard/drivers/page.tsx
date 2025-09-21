import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { drivers } from '@/lib/mock-data';
import type { Driver } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const statusLabels: Record<Driver['status'], string> = {
  available: 'Disponible',
  'in-trip': 'En Viaje',
  offline: 'Offline',
};

const statusBadgeVariants: Record<Driver['status'], "default" | "secondary" | "outline"> = {
    available: 'default',
    'in-trip': 'secondary',
    offline: 'outline',
};

export default function DriversPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Conductores</h1>
        <Button asChild className="bg-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-accent))]">
          <Link href="/dashboard/drivers/add">Añadir Conductor</Link>
        </Button>
      </div>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
          <CardHeader>
              <CardTitle>Lista de Conductores</CardTitle>
              <CardDescription>Gestiona los conductores de tu flota.</CardDescription>
          </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="text-right">Valoración</TableHead>
                <TableHead className="text-right">Viajes Hoy</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/40?u=${driver.id}`} alt={driver.name} />
                        <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {driver.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariants[driver.status]} className={driver.status === 'available' ? 'bg-green-100 text-green-800' : ''}>
                        {statusLabels[driver.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell className="text-right">{driver.rating.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{driver.tripsToday}</TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                             <Link href={`/dashboard/drivers/${driver.id}/edit`}>
                               <Pencil className="mr-2 h-4 w-4" />
                               Editar
                             </Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="text-destructive" onClick={() => alert('Eliminar (no implementado)')}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
