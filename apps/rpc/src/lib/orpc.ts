import { ORPCError, oc } from "@orpc/contract";

export const ocBase = oc.errors({
  TOO_MANY_REQUESTS: {
    message: "Too many requests have been made. Please try again later.",
  },
  INTERNAL_SERVER_ERROR: {
    message: "An unexpected error occurred",
  },
});

export const fail = (code: keyof typeof ocBase.errors, message: string) => {
  throw new ORPCError(code, {
    message,
  });
};
