import { BetterFetchError } from "@better-fetch/fetch";
import { createSerializationAdapter } from "@tanstack/react-router";
import { z } from "zod";

import { errorResSchema } from "./schemas";

export type AppBetterFetchError = Omit<BetterFetchError, "error"> & {
  error: z.infer<typeof errorResSchema>["error"] | undefined;
};

export const betterFetchErrorAdapter = createSerializationAdapter({
  key: "betterFetchError",
  test: (err): err is BetterFetchError => {
    return err instanceof BetterFetchError;
  },
  toSerializable: (err) => {
    const parsed = errorResSchema.safeParse(err.error);

    if (parsed.success) {
      return {
        message: err.message,
        error: parsed.data.error,
        status: err.status,
        statusText: err.statusText,
      };
    }

    return {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
    };
  },
  fromSerializable: (errObj): AppBetterFetchError => {
    return Object.assign(
      new BetterFetchError(errObj.status, errObj.statusText, errObj.error),
      {
        message: errObj.message,
        error: errObj.error,
      },
    );
  },
});

// type BetterFetchErrorPayload = z.infer<typeof errorResSchema>["error"];

// type SerializedBetterFetchError = {
//   message: string;
//   status: number;
//   statusText: string;
//   error?: BetterFetchErrorPayload;
// };

// export const betterFetchErrorAdapter = createSerializationAdapter<
//   BetterFetchError,
//   SerializedBetterFetchError
// >({
