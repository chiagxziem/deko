import { createStart } from "@tanstack/react-start";

import { betterFetchErrorAdapter } from "@/lib/error";

export const startInstance = createStart(() => {
  return {
    serializationAdapters: [betterFetchErrorAdapter],
  };
});
