import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/reveal';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 bg-primary text-primary-foreground">
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <Reveal>
          <h2 className="text-4xl md:text-6xl font-bold font-headline leading-tight">
            Comprometidos con la responsabilidad.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-lg md:text-xl text-primary-foreground/80 mt-4 max-w-3xl mx-auto">
            Tecnología inteligente para el transporte médico no urgente. Conductores, proveedores y centros de salud gestionan viajes con una eficiencia sin precedentes.
          </p>
        </Reveal>
        <Reveal delay={400} className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <a href="#registro">Crear Perfil de Conductor</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/50 text-white hover:bg-white hover:text-primary">
                <a href="#registro">Solicitar una Demo</a>
            </Button>
        </Reveal>
      </div>
    </section>
  );
}
