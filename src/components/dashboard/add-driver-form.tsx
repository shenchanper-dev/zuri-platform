

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { saveDriverAction } from "@/app/actions/driver-actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Driver } from "@/lib/types";
import Link from "next/link";
import { carBrands, districts } from "@/lib/constants";

const driverSchema = z.object({
  id: z.string().optional(),
  dni: z.string().length(8, "El DNI debe tener 8 dígitos.").regex(/^[0-9]+$/, "El DNI solo debe contener números."),
  fullName: z.string().min(3, "El nombre es obligatorio."),
  dob: z.date({ required_error: "La fecha de nacimiento es obligatoria."}).refine((date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, "El conductor debe ser mayor de 18 años.").refine((date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age <= 70;
  }, "El conductor no puede ser mayor de 70 años."),
  phone1: z.string().length(9, "El celular debe tener 9 dígitos.").startsWith("9", "El celular debe comenzar con 9."),
  phone2: z.string().optional().refine((val) => !val || (val.length === 9 && val.startsWith("9")), "El celular debe tener 9 dígitos y comenzar con 9."),
  address: z.string().max(100, "La dirección no puede exceder los 100 caracteres.").min(1, "La dirección es obligatoria."),
  district: z.string({ required_error: "El distrito es obligatorio."}).min(1, "El distrito es obligatorio."),
  email: z.string().email("Formato de correo electrónico inválido."),
  licenseNumber: z.string().max(12, "El número de brevete no debe exceder los 12 caracteres.").min(1, "El número de brevete es obligatorio."),
  carBrand: z.string().min(1, "La marca del auto es obligatoria."),
  carModel: z.string().min(1, "El modelo del auto es obligatorio."),
  plateNumber: z.string().min(1, "El número de placa es obligatorio."),
  owner: z.string().optional(),
  civilStatus: z.enum(["Soltero(a)", "Casado(a)", "Viudo(a)", "Divorciado(a)"]).optional(),
  childrenCount: z.coerce.number().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional().refine((val) => !val || (val.length === 9 && val.startsWith("9")), "El celular de contacto debe tener 9 dígitos y comenzar con 9."),
  status: z.enum(["Activo", "Inactivo", "Suspendido"]),
  hireDate: z.date({ required_error: "La fecha de ingreso es obligatoria."}),
  fireDate: z.date().optional(),
  observations: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

type DriverFormProps = {
  driver?: Driver | null;
}

// Helper to parse date string in YYYY-MM-DD format as UTC
const parseDateAsUTC = (dateString: string | undefined | null): Date | undefined => {
  if (!dateString) return undefined;
  // This approach handles timezone differences by parsing as UTC
  const [year, month, day] = (dateString as string).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};


export function AddDriverForm({ driver }: DriverFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      id: driver?.id || undefined,
      dni: driver?.dni || "",
      fullName: driver?.name || "",
      phone1: driver?.phone1 || "",
      address: driver?.address || "",
      district: driver?.district || "",
      email: driver?.email || "",
      licenseNumber: driver?.licenseNumber || "",
      carBrand: driver?.carBrand || "",
      carModel: driver?.vehicle?.split(' ').slice(1).join(' ') || "",
      plateNumber: driver?.plateNumber || "",
      status: "Activo",
      ...(driver && {
        ...driver,
        fullName: driver.name,
        civilStatus: driver.civilStatus || undefined,
        childrenCount: driver.childrenCount || undefined,
        contactName: driver.contactName || undefined,
        contactPhone: driver.contactPhone || undefined,
        owner: driver.owner || undefined,
        observations: driver.observations || undefined,
      }),
       dob: driver?.dob ? parseDateAsUTC(driver.dob as any) : undefined,
       hireDate: driver?.hireDate ? parseDateAsUTC(driver.hireDate as any) : new Date(),
       fireDate: driver?.fireDate ? parseDateAsUTC(driver.fireDate as any) : undefined,
    },
  });

  const onSubmit = async (values: DriverFormValues) => {
    setIsSubmitting(true);
    form.clearErrors();

    const formData = new FormData();
     // Helper to format date to 'yyyy-MM-dd'
    const formatDate = (date: Date | undefined) => {
        if (!date) return '';
        // Use getUTC* methods to prevent timezone shifts
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    for (const key in values) {
      const value = values[key as keyof DriverFormValues];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          formData.append(key, formatDate(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }

    const result = await saveDriverAction(null, formData);

    if (!result.success) {
      if (result.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages && messages.length > 0) {
            form.setError(field as keyof DriverFormValues, {
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
        description: `El conductor ${driver ? 'ha sido actualizado' : 'ha sido guardado'} correctamente.`,
      });
      router.push('/dashboard/drivers');
      router.refresh(); // Force a refresh to get new data
    }
    setIsSubmitting(false);
  };
  

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Columna 1 */}
          <div className="space-y-6">
             <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormControl>
                    <input type="hidden" {...field} value={field.value || ''} />
                  </FormControl>
                )}
              />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        captionLayout="dropdown-nav"
                        fromYear={1950}
                        toYear={new Date().getFullYear() - 18}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1930-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular 2 (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="987654321" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="conductor@zuri.pe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carBrand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca de Auto</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {carBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="plateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Placa</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="childrenCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Hijos (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={event => field.onChange(+event.target.value)} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular de Contacto (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="912345678" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propietario (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del propietario" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Ingreso</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        captionLayout="dropdown-nav"
                        fromYear={2010}
                        toYear={new Date().getFullYear()}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          {/* Columna 2 */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres y Apellidos</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="phone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular 1</FormLabel>
                  <FormControl>
                    <Input placeholder="987654321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domicilio</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Siempre Viva 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione distrito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map(district => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Brevete</FormLabel>
                  <FormControl>
                    <Input placeholder="Q12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo de Auto</FormLabel>
                  <FormControl>
                    <Input placeholder="Corolla" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="civilStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado civil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Soltero(a)">Soltero(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Viudo(a)">Viudo(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Contacto (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Suspendido">Suspendido</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="fireDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Cese (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        captionLayout="dropdown-nav"
                        fromYear={2010}
                        toYear={new Date().getFullYear() + 5}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Observación (Opcional)</FormLabel>
                <FormControl>
                <Textarea
                    placeholder="Enfermedad crónica, alergia, fobia, se encarga de menores, deuda grande, etc."
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild className="bg-transparent text-[hsl(var(--v2-foreground))]">
                <Link href="/dashboard/drivers">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--v2-accent))] hover:bg-[hsl(var(--v2-accent))]">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span>{driver ? 'Actualizar Conductor' : 'Guardar Conductor'}</span>
            </Button>
        </div>
      </form>
    </Form>
  );
}
