"use server";

import { dispatchTripRequest } from '@/ai/flows/trip-request-dispatch';
import { drivers } from '@/lib/mock-data';
import { z } from 'zod';

const DispatchTripSchema = z.object({
  clientLat: z.coerce.number(),
  clientLng: z.coerce.number(),
  tripDetails: z.string().min(10, "Por favor, proporcione más detalles sobre el viaje."),
});

export async function dispatchTripAction(prevState: any, formData: FormData) {
  const validatedFields = DispatchTripSchema.safeParse({
    clientLat: formData.get('clientLat'),
    clientLng: formData.get('clientLng'),
    tripDetails: formData.get('tripDetails'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { clientLat, clientLng, tripDetails } = validatedFields.data;

  try {
    const availableDriversForAI = drivers.map(d => ({
      driverId: d.id,
      location: {
        latitude: d.location.lat,
        longitude: d.location.lng,
      },
      isAvailable: d.status === 'available',
    }));

    const result = await dispatchTripRequest({
      clientLocation: {
        latitude: clientLat,
        longitude: clientLng,
      },
      availableDrivers: availableDriversForAI,
      tripDetails: tripDetails,
    });

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error("Error dispatching trip:", error);
    return {
      success: false,
      errors: { _form: ["Hubo un error al despachar el viaje. Por favor, inténtelo de nuevo."] }
    };
  }
}
