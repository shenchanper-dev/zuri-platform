import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Reveal } from '@/components/reveal';
import { Map } from '@/components/map';

const metrics = [
    { title: "Viajes en Progreso", value: "42", color: "text-foreground" },
    { title: "Conductores Activos", value: "112", color: "text-green-600" },
    { title: "Tasa de Éxito Hoy", value: "99.2%", color: "text-accent" },
];

const mapMarkers = [
    { coords: [-12.04, -77.03], popupContent: `<h3>Carlos Villa</h3><b>Estado:</b> En Viaje`, icon: { color: 'hsl(var(--primary))' } },
    { coords: [-12.05, -77.045], popupContent: `<h3>Ana Torres</h3><b>Estado:</b> Disponible`, icon: { color: '#10b981' } },
    { coords: [-12.06, -77.025], popupContent: `<h3>Luis Ramos</h3><b>Estado:</b> En Viaje`, icon: { color: 'hsl(var(--primary))' } },
    { coords: [-12.03, -77.05], popupContent: `<h3>Sofia Paz</h3><b>Estado:</b> Offline`, icon: { color: '#9ca3af' } },
    { coords: [-12.07, -77.06], popupContent: `<h3>Jorge Luna</h3><b>Estado:</b> Disponible`, icon: { color: '#10b981' } }
];

const mapRoute = [
    [-12.04, -77.03],
    [-12.045, -77.02],
    [-12.06, -77.025]
];

export function PlatformPreview() {
  return (
    <section id="plataforma" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-6 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Visibilidad y Control Total en Tiempo Real</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Nuestro dashboard centraliza toda la operación, permitiendo monitorear la flota, asignar viajes y optimizar rutas con datos precisos al instante.</p>
        </Reveal>
        
        <Reveal delay={200} className="mt-12">
          <Card className="text-left shadow-2xl p-2 md:p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b px-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              </div>
              <div className="text-sm text-muted-foreground">Dashboard de Operaciones ZURI</div>
              <div className="w-12"></div>
            </div>

            <div className="flex flex-col lg:flex-row mt-4 gap-4">
              <div className="w-full lg:w-1/4 bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-semibold font-headline text-foreground mb-4">Métricas Clave</h3>
                <div className="space-y-3">
                    {metrics.map(metric => (
                        <Card key={metric.title}>
                           <CardContent className="p-3">
                             <p className="text-sm text-muted-foreground">{metric.title}</p>
                             <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
              </div>
              <Map
                center={[-12.046374, -77.042793]}
                zoom={12}
                markers={mapMarkers}
                route={mapRoute}
                className="w-full lg:w-3/4 h-80 md:h-96 lg:h-[500px] rounded-lg shadow-inner border"
              />
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
