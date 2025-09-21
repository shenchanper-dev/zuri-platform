'use server';

/**
 * @fileOverview A flow for validating the format of uploaded Excel files.
 *
 * - validateExcelFormat - A function that validates the format of an Excel file.
 * - ValidateExcelFormatInput - The input type for the validateExcelFormat function.
 * - ValidateExcelFormatOutput - The return type for the validateExcelFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateExcelFormatInputSchema = z.object({
  excelDataUri: z
    .string()
    .describe(
      "An Excel file's data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  expectedHeaders: z
    .array(z.string())
    .describe('An array of the expected column headers in the Excel file.'),
});
export type ValidateExcelFormatInput = z.infer<typeof ValidateExcelFormatInputSchema>;

const ValidateExcelFormatOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the Excel file format is valid.'),
  errors: z.array(z.string()).describe('A list of errors found in the Excel file format.'),
});
export type ValidateExcelFormatOutput = z.infer<typeof ValidateExcelFormatOutputSchema>;

export async function validateExcelFormat(input: ValidateExcelFormatInput): Promise<ValidateExcelFormatOutput> {
  return validateExcelFormatFlow(input);
}

const validateExcelFormatPrompt = ai.definePrompt({
  name: 'validateExcelFormatPrompt',
  input: {schema: ValidateExcelFormatInputSchema},
  output: {schema: ValidateExcelFormatOutputSchema},
  prompt: `You are an expert in data validation, specifically for Excel files.

You will receive an Excel file as a data URI and a list of expected column headers.
Your task is to determine if the Excel file contains all the required columns and if the data types in each column are appropriate.

Here's the Excel file data URI: {{media url=excelDataUri}}

Here are the expected column headers: {{{expectedHeaders}}}

Respond with a boolean value indicating whether the Excel file format is valid and a list of any errors found.
If the file is valid, the errors list should be empty.
`,
});

const validateExcelFormatFlow = ai.defineFlow(
  {
    name: 'validateExcelFormatFlow',
    inputSchema: ValidateExcelFormatInputSchema,
    outputSchema: ValidateExcelFormatOutputSchema,
  },
  async input => {
    const {output} = await validateExcelFormatPrompt(input);
    return output!;
  }
);
