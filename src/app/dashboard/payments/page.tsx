import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Pagos</h1>
      <Card>
        <CardHeader>
            <CardTitle>Gestión de Pagos</CardTitle>
            <CardDescription>Esta sección está en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Aquí podrá ver un resumen de los pagos, gestionar facturas y configurar métodos de pago para los conductores.</p>
        </CardContent>
      </Card>
    </div>
  );
}
