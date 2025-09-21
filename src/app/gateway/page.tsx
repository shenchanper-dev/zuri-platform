import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building, Code } from 'lucide-react';

export default function GatewayPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-primary-foreground">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold font-headline tracking-wider text-primary-foreground">
          ZURI
        </h1>
        <p className="text-lg text-primary-foreground/80 mt-2">
          Tecnología inteligente para el transporte médico no urgente.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Button
          variant="outline"
          size="lg"
          className="w-64 h-24 text-lg border-white/50 text-white hover:bg-white hover:text-primary flex flex-col gap-2"
          asChild
        >
          <Link href="/login">
            <Code className="h-8 w-8" />
            <span>Zuri Programación</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-64 h-24 text-lg border-white/50 text-white hover:bg-white hover:text-primary flex flex-col gap-2"
          asChild
        >
          <Link href="/login">
            <Building className="h-8 w-8" />
            <span>Zuri Aplicación</span>
          </Link>
        </Button>
      </div>

      <p className="absolute bottom-6 text-sm text-primary-foreground/60">
        &copy; {new Date().getFullYear()} Zuri.pe. Todos los derechos reservados.
      </p>
    </div>
  );
}
