/** biome-ignore-all lint/suspicious/noExplicitAny: required */

import z from "zod";

export const createSuccessSchema = (details: string, schema: z.ZodType) => {
  return z.object({
    status: z.literal("success"),
    details: z.literal(details),
    data: schema,
  });
};

export const createErrorDescriptions = (
  responses: any,
  errors: Record<number, string>,
) => {
  const result: Record<string, any> = {};

  for (const [code, description] of Object.entries(errors)) {
    result[code] = {
      ...responses?.[code],
      description,
    };
  }

  return result;
};
