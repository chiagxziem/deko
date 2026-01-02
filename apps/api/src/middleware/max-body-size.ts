import type { MiddlewareHandler } from "hono";

import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse } from "@/lib/utils";

export const maxBodySize =
  (maxBytes: number): MiddlewareHandler =>
  async (c, next) => {
    const contentLength = c.req.header("content-length");

    if (contentLength) {
      const size = Number(contentLength);

      if (!Number.isNaN(size) && size > maxBytes) {
        return c.json(
          errorResponse(
            "PAYLOAD_TOO_LARGE",
            `Request body exceeds maximum size of ${maxBytes} bytes`,
          ),
          HttpStatusCodes.PAYLOAD_TOO_LARGE,
        );
      }
    }

    return next();
  };
