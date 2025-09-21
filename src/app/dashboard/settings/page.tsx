import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Ajustes</h1>
      <Card>
        <CardHeader>
            <CardTitle>Configuración de la Plataforma</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>En esta sección podrá configurar las notificaciones, los parámetros de la plataforma, gestionar su perfil de administrador y más.</p>
        </CardContent>
      </Card>
    </div>
  );
}
