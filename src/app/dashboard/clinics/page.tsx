"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { clinics } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClinicsPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clínicas</h1>
        <Button asChild className="bg-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-accent))]">
          <Link href="/dashboard/clinics/add">Añadir Clínica</Link>
        </Button>
      </div>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
          <CardHeader>
              <CardTitle>Lista de Clínicas</CardTitle>
              <CardDescription>Gestiona las clínicas y empresas asociadas.</CardDescription>
          </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono Central</TableHead>
                <TableHead>Email</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-[hsl(var(--v2-accent))] text-white">{clinic.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {clinic.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {clinic.centralPhone || 'N/A'}
                  </TableCell>
                  <TableCell>{clinic.clinicEmail || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem asChild>
                             <Link href={`/dashboard/clinics/${clinic.id}/edit`}>
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
