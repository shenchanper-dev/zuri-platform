import { Reveal } from '@/components/reveal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  return (
    <section id="registro" className="py-20 sm:py-32 bg-primary">
      <div className="container mx-auto px-6 max-w-xl text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary-foreground">
            ¿Listo para conducir con Zuri?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Regístrate abajo para unirte a nuestra red de proveedores de transporte.
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12 text-left">
          <form className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-primary-foreground/80">Nombre de pila</Label>
                <Input type="text" id="nombre" placeholder="John" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-accent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-primary-foreground/80">Apellido</Label>
                <Input type="text" id="apellido" placeholder="Doe" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-accent" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary-foreground/80">Su correo electrónico</Label>
              <Input type="email" id="email" placeholder="john.doe@example.com" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-accent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-primary-foreground/80">Número de teléfono</Label>
              <Input type="tel" id="telefono" placeholder="+1 (555) 123-4567" className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-accent" />
            </div>
            <div>
              <Button type="submit" size="lg" className="w-full text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                Crear Perfil
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/60 text-center pt-4">
              Al enviar este formulario, certifico que la información es precisa y completa. Acepto los <a href="#" className="underline hover:text-white">Términos y Condiciones</a> de Zuri.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
