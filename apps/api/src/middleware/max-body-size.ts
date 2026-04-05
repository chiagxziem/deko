import type { MiddlewareHandler } from "hono";

import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse } from "@/lib/utils";

export const maxBodySize =
  (maxBytes: number): MiddlewareHandler =>
  async (c, next) => {
    // when content-length is present we can reject early without reading body
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

    // if content-length is missing (e.g., chunked transfer),
    // we explicitly read the raw body and enforce the same hard limit
    const clonedRequest = c.req.raw.clone();
    const rawBody = await clonedRequest.arrayBuffer();

    if (rawBody.byteLength > maxBytes) {
      return c.json(
        errorResponse(
          "PAYLOAD_TOO_LARGE",
          `Request body exceeds maximum size of ${maxBytes} bytes`,
        ),
        HttpStatusCodes.PAYLOAD_TOO_LARGE,
      );
    }

    return next();
  };
