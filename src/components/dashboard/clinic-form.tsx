

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Clinic } from "@/lib/types";
import Link from "next/link";
import { saveClinicAction } from "@/app/actions/clinic-actions";
import { Separator } from "../ui/separator";

const phoneValidation = z.string().optional().refine((val) => !val || /^[0-9\s-()+]*$/.test(val), "Formato de teléfono inválido.");

const clinicSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre de la clínica es obligatorio."),
  address: z.string().optional(),
  centralPhone: phoneValidation,
  clinicEmail: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, "Formato de correo electrónico inválido."),

  contactName1: z.string().optional(),
  charge1: z.string().optional(),
  cellphone1: phoneValidation,
  emailCli1: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, "Formato de correo electrónico inválido."),

  contactName2: z.string().optional(),
  charge2: z.string().optional(),
  cellphone2: phoneValidation,
  emailCli2: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, "Formato de correo electrónico inválido."),

  serviceTypes: z.string().optional(),
});

type ClinicFormValues = z.infer<typeof clinicSchema>;

type ClinicFormProps = {
  clinic?: Clinic | null;
}

export function ClinicForm({ clinic }: ClinicFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      id: clinic?.id || undefined,
      name: clinic?.name || "",
      address: clinic?.address || "",
      centralPhone: clinic?.centralPhone || "",
      clinicEmail: clinic?.clinicEmail || "",
      contactName1: clinic?.contactName1 || "",
      charge1: clinic?.charge1 || "",
      cellphone1: clinic?.cellphone1 || "",
      emailCli1: clinic?.emailCli1 || "",
      contactName2: clinic?.contactName2 || "",
      charge2: clinic?.charge2 || "",
      cellphone2: clinic?.cellphone2 || "",
      emailCli2: clinic?.emailCli2 || "",
      serviceTypes: clinic?.serviceTypes || "",
    },
  });

  const onSubmit = async (values: ClinicFormValues) => {
    setIsSubmitting(true);
    form.clearErrors();

    const formData = new FormData();
    for (const key in values) {
      const value = values[key as keyof ClinicFormValues];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
    
    const result = await saveClinicAction(null, formData);

    if (!result.success) {
       if (result.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
           if (messages && messages.length > 0) {
               form.setError(field as keyof ClinicFormValues, {
                   type: 'manual',
                   message: messages.join(', '),
               });
           }
       }
      }
      toast({
        title: "Error",
        description: result.errors?._form?.[0] || "Por favor revise los errores en el formulario.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Éxito!",
        description: `La clínica ${clinic ? 'ha sido actualizada' : 'ha sido guardada'} correctamente.`,
      });
      router.push('/dashboard/clinics');
      router.refresh();
    }
    setIsSubmitting(false);
  };


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Información General</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormControl>
                        <input type="hidden" {...field} value={field.value || ''}/>
                      </FormControl>
                    )}
                  />
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de la Clínica/Empresa</FormLabel>
                        <FormControl>
                            <Input placeholder="Clínica Internacional" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                            <Input placeholder="Av. Principal 123" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="centralPhone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teléfono Central</FormLabel>
                        <FormControl>
                            <Input placeholder="01-123-4567" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="clinicEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Clínica</FormLabel>
                        <FormControl>
                            <Input placeholder="contacto@clinica.com" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
        </div>

        <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Contacto 1</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="contactName1"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de Contacto 1</FormLabel>
                        <FormControl>
                            <Input placeholder="Juan Pérez" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="charge1"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cargo 1</FormLabel>
                        <FormControl>
                            <Input placeholder="Gerente de Operaciones" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cellphone1"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Celular 1</FormLabel>
                        <FormControl>
                            <Input placeholder="987654321" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="emailCli1"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Contacto 1</FormLabel>
                        <FormControl>
                            <Input placeholder="contacto1@clinica.com" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Contacto 2</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="contactName2"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de Contacto 2</FormLabel>
                        <FormControl>
                            <Input placeholder="Ana Gómez" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="charge2"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cargo 2</FormLabel>
                        <FormControl>
                            <Input placeholder="Coordinadora" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="cellphone2"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Celular 2</FormLabel>
                        <FormControl>
                            <Input placeholder="912345678" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="emailCli2"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Contacto 2</FormLabel>
                        <FormControl>
                            <Input placeholder="contacto2@clinica.com" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        <Separator />

        <div className="space-y-4">
             <h3 className="text-lg font-medium">Detalles Adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="serviceTypes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tipos de Servicios</FormLabel>
                        <FormControl>
                             <Textarea
                                placeholder="MAD, Laboratorio, CI, etc."
                                className="resize-none"
                                {...field}
                                value={field.value || ''}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" asChild className="bg-transparent text-[hsl(var(--v2-foreground))]">
                <Link href="/dashboard/clinics">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-accent))]">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span>{clinic ? 'Actualizar Clínica' : 'Guardar Clínica'}</span>
            </Button>
        </div>
      </form>
    </Form>
  );
}
