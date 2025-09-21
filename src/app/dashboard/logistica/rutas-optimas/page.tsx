import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RutasOptimasPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <h1 className="text-3xl font-bold">Rutas Óptimas</h1>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
            <CardTitle>Optimización de Rutas</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá calcular y visualizar las rutas más eficientes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
