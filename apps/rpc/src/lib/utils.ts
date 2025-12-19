/**
 * Helper function to create a success response for API routes.
 * @param data - The data to include in the response.
 * @param details - Additional details about the response.
 * @returns An object representing the success response.
 */
export const successResponse = (data: unknown, details: string) => {
  return {
    status: "success",
    details,
    data,
  } as const;
};

/**
 * Helper function to create an error response for API routes.
 * @param code - The error code.
 * @param details - Additional details about the error.
 * @returns An object representing the error response.
 */
export const errorResponse = (code: string, details: string) => {
  return {
    status: "error",
    error: {
      code,
      details,
    },
  };
};
