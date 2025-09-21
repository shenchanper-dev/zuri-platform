
"use server";

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { drivers } from '@/lib/mock-data';

const driverSchema = z.object({
  id: z.string().optional(),
  dni: z.string().length(8, "El DNI debe tener 8 dígitos.").regex(/^[0-9]+$/, "El DNI solo debe contener números."),
  fullName: z.string().min(3, "El nombre es obligatorio."),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de nacimiento inválida."),
  phone1: z.string().length(9, "El celular debe tener 9 dígitos.").startsWith("9", "El celular debe comenzar con 9."),
  phone2: z.string().optional().refine((val) => !val || (val.length === 9 && val.startsWith("9")), "El celular debe tener 9 dígitos y comenzar con 9."),
  address: z.string().max(100, "La dirección no puede exceder los 100 caracteres.").min(1, "La dirección es obligatoria."),
  district: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido."),
  licenseNumber: z.string().max(12, "El número de brevete no debe exceder los 12 caracteres.").min(1, "El número de brevete es obligatorio."),
  carBrand: z.string().min(1, "La marca del auto es obligatoria."),
  carModel: z.string().min(1, "El modelo del auto es obligatorio."),
  plateNumber: z.string().min(1, "El número de placa es obligatorio."),
  owner: z.string().optional(),
  civilStatus: z.enum(["Soltero(a)", "Casado(a)", "Viudo(a)", "Divorciado(a)"]).optional(),
  childrenCount: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional().refine((val) => !val || (val.length === 9 && val.startsWith("9")), "El celular de contacto debe tener 9 dígitos y comenzar con 9."),
  status: z.enum(["Activo", "Inactivo", "Suspendido"]),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha de ingreso inválida."),
  fireDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Fecha de cese inválida."),
  observations: z.string().optional(),
});


export async function saveDriverAction(prevState: any, formData: FormData) {
    
    const validatedFields = driverSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        const data = validatedFields.data;
        if (data.id) {
            // This is an update
            const driverIndex = drivers.findIndex(d => d.id === data.id);
            if (driverIndex > -1) {
                console.log("Updating driver:", data.id);
                const existingDriver = drivers[driverIndex];
                
                // Update the driver object in the mock data array
                drivers[driverIndex] = {
                    ...existingDriver,
                    name: data.fullName,
                    dni: data.dni,
                    dob: new Date(data.dob),
                    phone1: data.phone1,
                    phone2: data.phone2,
                    address: data.address,
                    district: data.district,
                    email: data.email,
                    licenseNumber: data.licenseNumber,
                    carBrand: data.carBrand,
                    carModel: data.carModel,
                    vehicle: `${data.carBrand} ${data.carModel}`,
                    plateNumber: data.plateNumber,
                    owner: data.owner,
                    civilStatus: data.civilStatus,
                    childrenCount: data.childrenCount ? parseInt(data.childrenCount, 10) : undefined,
                    contactName: data.contactName,
                    contactPhone: data.contactPhone,
                    // status is not on the form, keep existing status
                    hireDate: new Date(data.hireDate),
                    fireDate: data.fireDate ? new Date(data.fireDate) : undefined,
                    observations: data.observations,
                };
            } else {
                 console.error("Driver not found for update:", data.id);
                 return {
                     success: false,
                     errors: { _form: ["No se encontró el conductor para actualizar."] }
                 };
            }
        } else {
            // This is a create
            console.log("Creating new driver:", data);
            // Here you would typically call your database to create a new driver
             const newDriver = {
                id: `DRI${(drivers.length + 1).toString().padStart(3, '0')}`,
                name: data.fullName,
                status: 'offline' as const, // Default status
                location: { lat: -12.04, lng: -77.03 }, // Default location
                vehicle: `${data.carBrand} ${data.carModel}`,
                rating: 0,
                tripsToday: 0,
                dni: data.dni,
                dob: new Date(data.dob),
                phone1: data.phone1,
                phone2: data.phone2,
                address: data.address,
                district: data.district,
                email: data.email,
                licenseNumber: data.licenseNumber,
                carBrand: data.carBrand,
                carModel: data.carModel,
                plateNumber: data.plateNumber,
                owner: data.owner,
                civilStatus: data.civilStatus,
                childrenCount: data.childrenCount ? parseInt(data.childrenCount, 10) : undefined,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                hireDate: new Date(data.hireDate),
                fireDate: data.fireDate ? new Date(data.fireDate) : undefined,
                observations: data.observations,
            };
            drivers.push(newDriver);
        }
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));

        revalidatePath('/dashboard/drivers');

        return {
            success: true,
            errors: null
        }

    } catch (error) {
        console.error("Error saving driver:", error);
        return {
            success: false,
            errors: { _form: ["Hubo un error al guardar el conductor."] }
        };
    }
}
