import { ExcelUploader } from "@/components/dashboard/excel-uploader";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6 text-[hsl(var(--v2-foreground))]">
      <h1 className="text-3xl font-bold">Importar desde Excel</h1>
      <div className="bg-[hsl(var(--v2-card))] p-6 rounded-lg border-[hsl(var(--v2-border))]">
        <ExcelUploader />
      </div>
    </div>
  );
}
