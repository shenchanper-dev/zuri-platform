import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Truck,
  User,
  Building,
  CalendarCheck,
  FileText,
  Route,
  Siren,
  BarChart,
  Bell,
  Settings,
  CircleHelp,
  Plus,
  FileUp,
  Hospital,
  Send,
  Book,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/dashboard/logistica', label: 'Dashboard', icon: LayoutGrid },
  { href: '/dashboard/import', label: 'Importar Excel', icon: FileUp },
  { href: '/dashboard/drivers', label: 'Conductores', icon: User },
  { href: '/dashboard/clinics', label: 'Clínicas', icon: Building },
  { href: '/dashboard/hospitals', label: 'Hospitales', icon: Hospital },
  { href: '/dashboard/dispatch', label: 'Despacho', icon: Send },
  { href: '/dashboard/reservations', label: 'Reservaciones', icon: Book },
  { href: '/dashboard/logistica/servicios', label: 'Servicios Hoy', icon: CalendarCheck },
  { href: '/dashboard/logistica/programacion', label: 'Programación', icon: CalendarCheck },
  { href: '/dashboard/logistica/rutas-optimas', label: 'Rutas Óptimas', icon: Route },
  { href: '/dashboard/logistica/emergencias', label: 'Emergencias', icon: Siren },
  { href: '/dashboard/logistica/reportes', label: 'Reportes', icon: BarChart },
  { href: '/dashboard/logistica/pacientes', label: 'Pacientes', icon: User },
  { href: '/dashboard/logistica/vehiculos', label: 'Vehículos Médicos', icon: Truck },
  { href: '/dashboard/logistica/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/logistica/configuracion', label: 'Configuración', icon: Settings },
];

export default function DashboardV2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[hsl(var(--v2-background))] text-[hsl(var(--v2-foreground))]">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-[hsl(var(--v2-sidebar-background))] p-2 md:flex">
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--v2-border))]">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-black">ZURI</h1>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus />
          </Button>
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[hsl(var(--v2-sidebar-foreground))] transition-colors hover:bg-[hsl(var(--v2-sidebar-accent))] hover:text-[hsl(var(--v2-sidebar-accent-foreground))]"
            >
              <item.icon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-[hsl(var(--v2-sidebar-accent-foreground))]" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold">Dashboard Principal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-[hsl(var(--v2-accent))] text-white hover:bg-[hsl(var(--v2-accent))]">
              Preguntar a ZURI
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-700 text-white">ZU</AvatarFallback>
                  </Avatar>
                  <span>Admin ZURI</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card text-card-foreground">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Ajustes</DropdownMenuItem>
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Cerrar Sesión</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
