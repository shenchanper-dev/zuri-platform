'use server';

/**
 * @fileOverview Automatically dispatches trip requests to available drivers based on location and availability.
 *
 * - dispatchTripRequest - A function that handles the trip request dispatch process.
 * - TripRequestDispatchInput - The input type for the dispatchTripRequest function.
 * - TripRequestDispatchOutput - The return type for the dispatchTripRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TripRequestDispatchInputSchema = z.object({
  clientLocation: z
    .object({
      latitude: z.number().describe('The latitude of the client.'),
      longitude: z.number().describe('The longitude of the client.'),
    })
    .describe('The location of the client requesting the trip.'),
  availableDrivers: z
    .array(
      z.object({
        driverId: z.string().describe('The unique identifier of the driver.'),
        location: z
          .object({
            latitude: z.number().describe('The latitude of the driver.'),
            longitude: z.number().describe('The longitude of the driver.'),
          })
          .describe('The current location of the driver.'),
        isAvailable: z
          .boolean()
          .describe('Whether the driver is currently available to accept a trip.'),
      })
    )
    .describe('A list of available drivers with their locations and availability.'),
  tripDetails: z.string().describe('Details about the trip, such as pickup time and destination.'),
});
export type TripRequestDispatchInput = z.infer<typeof TripRequestDispatchInputSchema>;

const TripRequestDispatchOutputSchema = z.object({
  driverId: z.string().describe('The ID of the driver to whom the trip request is dispatched.'),
  reason: z.string().describe('The reason why the driver was selected.'),
});
export type TripRequestDispatchOutput = z.infer<typeof TripRequestDispatchOutputSchema>;

export async function dispatchTripRequest(
  input: TripRequestDispatchInput
): Promise<TripRequestDispatchOutput> {
  return tripRequestDispatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tripRequestDispatchPrompt',
  input: {schema: TripRequestDispatchInputSchema},
  output: {schema: TripRequestDispatchOutputSchema},
  prompt: `You are an expert trip dispatcher for a non-emergency medical transportation (NEMT) service.

Given a client's location, a list of available drivers with their locations and availability, and trip details, determine the best driver to dispatch the trip to.

Consider the following factors when selecting a driver:
- Proximity to the client
- Driver availability

Client Location: {{{clientLocation.latitude}}}, {{{clientLocation.longitude}}}

Available Drivers:
{{#each availableDrivers}}
- Driver ID: {{{driverId}}}, Location: {{{location.latitude}}}, {{{location.longitude}}}, Available: {{isAvailable}}
{{/each}}

Trip Details: {{{tripDetails}}}

RETURN ONLY THE DRIVER ID AND THE REASON WHY THE DRIVER WAS SELECTED. DO NOT INCLUDE ANY OTHER TEXT.
`,
});

const tripRequestDispatchFlow = ai.defineFlow(
  {
    name: 'tripRequestDispatchFlow',
    inputSchema: TripRequestDispatchInputSchema,
    outputSchema: TripRequestDispatchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
