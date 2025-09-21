import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NotificacionesPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <h1 className="text-3xl font-bold">Notificaciones</h1>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
            <CardTitle>Centro de Notificaciones</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá ver y gestionar las notificaciones del sistema.</p>
        </CardContent>
      </Card>
    </div>
  );
}
