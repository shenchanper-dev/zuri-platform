"use server";

import { validateExcelFormat } from '@/ai/flows/excel-format-validation';
import { z } from 'zod';

const ExcelValidationSchema = z.object({
  file: z.instanceof(File),
});

export async function validateExcelAction(prevState: any, formData: FormData) {
  const validatedFields = ExcelValidationSchema.safeParse({
    file: formData.get('excelFile'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: { _form: ['No se ha proporcionado un archivo válido.'] },
    };
  }

  const { file } = validatedFields.data;

  if (file.size === 0) {
     return {
      success: false,
      errors: { _form: ['El archivo está vacío.'] },
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const expectedHeaders = ['ClientID', 'PatientName', 'PickupAddress', 'DropoffAddress', 'AppointmentTime'];

    const result = await validateExcelFormat({
      excelDataUri: dataUri,
      expectedHeaders: expectedHeaders,
    });

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error("Error validating excel:", error);
    return {
      success: false,
      errors: { _form: ["Hubo un error al procesar el archivo. Por favor, inténtelo de nuevo."] }
    };
  }
}
