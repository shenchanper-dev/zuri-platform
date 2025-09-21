import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VehiculosPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <h1 className="text-3xl font-bold">Vehículos Médicos</h1>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
            <CardTitle>Gestión de Vehículos</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá gestionar la flota de vehículos médicos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
