import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Users, Activity, AlertTriangle, CheckCircle, UserPlus, FileSpreadsheet, Route as RouteIcon, Clock, RefreshCw } from 'lucide-react';
import { Map } from '@/components/map';
import { drivers } from '@/lib/mock-data';
import type { Driver } from '@/lib/types';
import type { LatLngExpression } from 'leaflet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


const statusStyles: Record<Driver['status'], string> = {
  available: 'bg-green-500',
  'in-trip': 'bg-blue-500',
  offline: 'bg-gray-400',
};

const statusLabels: Record<Driver['status'], string> = {
    available: 'Disponible',
    'in-trip': 'En Viaje',
    offline: 'Offline',
};

const statCards = [
    { title: 'Vehículos Activos', value: '12', icon: Truck, color: 'text-blue-500' },
    { title: 'Conductores Disponibles', value: '18', icon: Users, color: 'text-black' },
    { title: 'Servicios Hoy', value: '47', icon: Activity, color: 'text-green-500' },
    { title: 'Emergencias Activas', value: '2', icon: AlertTriangle, color: 'text-red-500' },
];

const recentActivityData = [
    {
        icon: CheckCircle,
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        title: "Servicio completado exitosamente",
        description: "Ben Agr completó traslado de paciente desde Clínica Internacional",
        time: "Hace 3 minutos",
    },
    {
        icon: UserPlus,
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        title: "Nuevo conductor registrado",
        description: "Carlos Martinez se unió al equipo de conductores médicos",
        time: "Hace 15 minutos",
    },
    {
        icon: AlertTriangle,
        bgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        title: "Vehículo en mantenimiento",
        description: "Ambulancia A4 fuera de servicio por mantenimiento preventivo",
        time: "Hace 25 minutos",
    },
    {
        icon: FileSpreadsheet,
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        title: "Archivo Excel procesado",
        description: "Se procesaron 28 nuevos turnos médicos desde el archivo del día",
        time: "Hace 1 hora",
    },
    {
        icon: RouteIcon,
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        title: "Ruta optimizada calculada",
        description: "Nueva ruta eficiente para zona de San Borja - Miraflores",
        time: "Hace 2 horas",
    },
];


function DriverList() {
    const onlineDrivers = drivers.filter(d => d.status !== 'offline');
    return (
        <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))] shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Conductores en línea</CardTitle>
                <CardDescription className="text-xs">{onlineDrivers.length} de {drivers.length} conductores activos</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {onlineDrivers.map(driver => (
                    <div key={driver.id} className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                           <AvatarImage src={`https://i.pravatar.cc/40?u=${driver.id}`} alt={driver.name} />
                           <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">{driver.vehicle}</p>
                        </div>
                        <div className="ml-auto">
                            <Badge variant={driver.status === 'available' ? 'default' : 'secondary'} className={driver.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                                {statusLabels[driver.status]}
                            </Badge>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function RecentActivity() {
    return (
        <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className='flex items-center gap-2'>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </div>
                <Button variant="outline" size="sm" className='bg-transparent text-[hsl(var(--v2-accent))] border-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-sidebar-accent))] hover:text-[hsl(var(--v2-sidebar-accent-foreground))]'>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                {recentActivityData.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.bgColor}`}>
                            <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function DashboardV2Page() {

    const mapMarkers = drivers.map(driver => ({
        coords: [driver.location.lat, driver.location.lng] as LatLngExpression,
        popupContent: `
            <div class="p-1">
                <h3 class="font-bold text-md mb-1">${driver.name}</h3>
                <p class="text-sm"><span class="font-semibold">Estado:</span> ${statusLabels[driver.status]}</p>
                <p class="text-sm"><span class="font-semibold">Vehículo:</span> ${driver.vehicle}</p>
            </div>
        `,
        icon: {
            color: statusStyles[driver.status],
        },
    }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))] shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <div className="p-3">
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card className="h-[600px] p-2 bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
                    <Map 
                        center={[-12.05, -77.04]} 
                        zoom={12}
                        markers={mapMarkers}
                        className="h-full w-full rounded-md"
                    />
                </Card>
            </div>
            <div className="lg:col-span-1">
                <DriverList />
            </div>
      </div>
      
      <RecentActivity />

    </div>
  );
}
