import { ClinicForm } from "@/components/dashboard/clinic-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddClinicPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="bg-transparent text-[hsl(var(--v2-foreground))]">
          <Link href="/dashboard/clinics">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-[hsl(var(--v2-accent))]">Añadir Nueva Clínica</h1>
      </div>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
          <CardTitle>Formulario de Registro de Clínica</CardTitle>
          <CardDescription>
            Complete los siguientes campos para registrar una nueva clínica en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicForm />
        </CardContent>
      </Card>
    </div>
  );
}