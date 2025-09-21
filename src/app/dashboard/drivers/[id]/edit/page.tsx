import { AddDriverForm } from "@/components/dashboard/add-driver-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { drivers } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default function EditDriverPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const driver = drivers.find(d => d.id === id);

  if (!driver) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon" className="bg-transparent text-[hsl(var(--v2-foreground))]">
          <Link href="/dashboard/drivers">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Conductor</h1>
      </div>
      <Card className="bg-[hsl(var(--v2-card))] border-[hsl(var(--v2-border))]">
        <CardHeader>
          <CardTitle>Información del Conductor</CardTitle>
          <CardDescription>
            Actualice los datos del conductor y guarde los cambios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddDriverForm driver={driver} />
        </CardContent>
      </Card>
    </div>
  );
}
