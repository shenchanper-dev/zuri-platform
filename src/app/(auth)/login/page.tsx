import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Acceso de Administrador</CardTitle>
        <CardDescription>
          Ingrese sus credenciales para acceder al panel de control.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/dashboard" className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@zuri.pe"
              required
              defaultValue="admin@zuri.pe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" required defaultValue="password" />
          </div>
          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>
        </form>
         <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="#" className="underline">
              Solicitar Acceso
            </Link>
          </div>
      </CardContent>
    </Card>
  );
}
