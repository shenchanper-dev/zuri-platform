

"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { validateExcelAction } from "@/app/actions/excel-actions";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { FileUp, ListChecks, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="bg-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-accent))]">
            {pending ? "Validando..." : "Validar Archivo"}
            <FileUp className="ml-2 h-4 w-4" />
        </Button>
    );
}


export function ExcelUploader() {
    const [state, formAction] = useActionState(validateExcelAction, { success: false });
    const [fileName, setFileName] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileName(e.target.files?.[0]?.name || "");
    };

    useEffect(() => {
        if (state.success && state.data?.isValid) {
            formRef.current?.reset();
            setFileName("");
        }
    }, [state]);

    return (
        <Card className="max-w-2xl w-full bg-transparent border-0 shadow-none">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-bold">Importar Datos de Clientes</CardTitle>
                <CardDescription>
                    Suba un archivo Excel con los datos de los servicios de la clínica. El sistema validará que el formato sea correcto.
                </CardDescription>
            </CardHeader>
            <form ref={formRef} action={formAction}>
                <CardContent className="space-y-4 p-0">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="excelFile">Archivo Excel</Label>
                        <Input id="excelFile" name="excelFile" type="file" accept=".xlsx, .xls" required onChange={handleFileChange} />
                        {fileName && <p className="text-sm text-muted-foreground">Archivo seleccionado: {fileName}</p>}
                    </div>

                    {state.errors?._form && (
                        <Alert variant="destructive">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{state.errors._form[0]}</AlertDescription>
                        </Alert>
                    )}

                    {state.success && state.data && (
                        state.data.isValid ? (
                             <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                                <ShieldCheck className="h-4 w-4 !text-green-600" />
                                <AlertTitle>¡Validación Exitosa!</AlertTitle>
                                <AlertDescription>
                                    El formato del archivo es correcto y está listo para ser procesado.
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert variant="destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Errores de Formato Encontrados</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-5 mt-2">
                                    {state.data.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )
                    )}

                </CardContent>
                <CardFooter className="flex justify-between p-0 pt-4">
                    <div className="text-muted-foreground text-sm flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        <span>Espera encabezados: ClientID, etc.</span>
                    </div>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    );
}
