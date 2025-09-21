import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HospitalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Hospitales</h1>
      <Card>
        <CardHeader>
            <CardTitle>Gestión de Hospitales</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá gestionar la información y los contactos de los hospitales asociados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
