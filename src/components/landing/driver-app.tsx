import Image from 'next/image';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';

export function DriverApp() {
  return (
    <section id="conductores" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <Reveal className="order-2 md:order-1">
          <Image 
            src="https://picsum.photos/400/800"
            alt="Aplicación móvil de Zuri" 
            width={350}
            height={700}
            data-ai-hint="mobile app"
            className="rounded-3xl shadow-2xl max-w-xs mx-auto"
          />
        </Reveal>
        <Reveal delay={200} className="order-1 md:order-2">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Nuestra aplicación para conductores</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nuestra aplicación (compatible con iPhone y Android), permite a los usuarios aceptar y administrar viajes, enviar comunicaciones a miembros, recibir instrucciones especiales y cargar documentación para garantizar que se satisfagan las necesidades de cada miembro.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href="#registro">Conviértete en conductor</a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
