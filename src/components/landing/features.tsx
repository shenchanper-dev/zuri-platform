import Image from 'next/image';
import { Reveal } from '@/components/reveal';

const features = [
    {
        title: "Portal de Gestión ZuriView",
        description: "Administra todos los viajes de tus miembros desde un solo lugar con nuestro portal web. Reserva viajes, consulta información y genera reportes en tiempo real."
    },
    {
        title: "Aplicación para Conductores",
        description: "Seguimiento en tiempo real, instrucciones de viaje, y controles de suministro a través de la app. Todo lo que el conductor necesita en la palma de su mano."
    },
    {
        title: "Seguridad y Capacitación",
        description: "Todos los proveedores se someten a capacitación sobre HIPAA y ADA, con verificaciones de antecedentes y inspecciones anuales de vehículos."
    }
];

export function Features() {
  return (
    <section className="py-20 sm:py-32 bg-card">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="relative pl-12">
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border"></div>
              {features.map((feature, index) => (
                <div key={index} className="mb-12 last:mb-0">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-accent ring-4 ring-card"></div>
                  <h3 className="text-xl font-bold font-headline text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <Image 
              src="https://picsum.photos/600/500"
              alt="Interfaz de la plataforma Zuri" 
              width={600}
              height={500}
              data-ai-hint="platform interface"
              className="rounded-xl shadow-2xl"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
