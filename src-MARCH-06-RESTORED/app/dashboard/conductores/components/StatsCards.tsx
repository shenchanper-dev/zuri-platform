import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, Clock, UserCheck } from "lucide-react";
import type { EstadisticasConductores } from "@/domain/entities/Conductor.entity";

export function StatsCards({ stats }: { stats: EstadisticasConductores }) {
  // Datos basados en [cite: 9, 10, 11, 12, 13]
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Conductores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Registrados en plataforma</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponibles (NEMT)</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.disponibles}</div>
          <p className="text-xs text-muted-foreground">Listos para asignar</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Servicio</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.en_servicio}</div>
          <p className="text-xs text-muted-foreground">Realizando traslados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vehículos Propios</CardTitle>
          <Car className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.con_foto}</div>
          <p className="text-xs text-muted-foreground">Flota externa</p>
        </CardContent>
      </Card>
    </div>
  );
}