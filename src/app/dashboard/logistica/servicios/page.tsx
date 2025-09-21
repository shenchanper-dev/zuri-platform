import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ServiciosPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <h1 className="text-3xl font-bold">Servicios de Hoy</h1>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
            <CardTitle>Gestión de Servicios</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá gestionar los servicios programados para hoy.</p>
        </CardContent>
      </Card>
    </div>
  );
}
