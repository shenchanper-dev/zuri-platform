

// app/dashboard/clinics/[id]/edit/page.tsx

import { ClinicForm } from "@/components/dashboard/clinic-form";
import { clinics } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


interface EditClinicPageProps {
  params: { id: string };
}

export default function EditClinicPage({ params }: EditClinicPageProps) {
  const { id } = params;
  const clinic = clinics.find(c => c.id === id);

  if (!clinic) {
    notFound();
  }
  
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="bg-transparent text-[hsl(var(--v2-foreground))]">
          <Link href="/dashboard/clinics">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Clínica</h1>
      </div>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
          <CardTitle>Información de la Clínica</CardTitle>
          <CardDescription>
            Actualice los datos de la clínica y guarde los cambios. El ID de la clínica es {id}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicForm clinic={clinic} />
        </CardContent>
      </Card>
    </div>
  );
}
