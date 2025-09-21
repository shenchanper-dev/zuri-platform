

"use server";

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { clinics } from '@/lib/mock-data';

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

export async function saveClinicAction(prevState: any, formData: FormData) {
    const validatedFields = clinicSchema.safeParse(
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
            const clinicIndex = clinics.findIndex(c => c.id === data.id);
            if (clinicIndex > -1) {
                console.log("Updating clinic:", data.id);
                 // Update the clinic object in the mock data array
                 clinics[clinicIndex] = {
                    ...clinics[clinicIndex],
                    ...data,
                 };
            } else {
                console.error("Clinic not found for update:", data.id);
                return {
                    success: false,
                    errors: { _form: ["No se encontró la clínica para actualizar."] }
                };
            }
        } else {
            // This is a create
            console.log("Creating new clinic:", data);
            const newClinic = {
                id: `CLI${(clinics.length + 1).toString().padStart(3, '0')}`,
                ...data,
            };
            clinics.push(newClinic);
        }

        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));

        revalidatePath('/dashboard/clinics');

        return {
            success: true,
            errors: null
        }

    } catch (error) {
        console.error("Error saving clinic:", error);
        return {
            success: false,
            errors: { _form: ["Hubo un error al guardar la clínica."] }
        };
    }
}
