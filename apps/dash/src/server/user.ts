import type { User } from "@repo/db/schemas/auth.schema";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { DetailedError, parseResponse } from "hono/client";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import { rpc, rpcErrMsg } from "@/lib/rpc";
import type { ApiSuccessResponse } from "@/lib/types";
import { headersMiddleware } from "@/middleware/headers-middleware";

// get user server fn
export const $getUser = createServerFn({
  method: "GET",
})
  .middleware([headersMiddleware])
  .handler(async ({ context }) => {
    try {
      const _axiosRes = await axiosClient.get<ApiSuccessResponse<User>>(
        "/user/me",
        {
          headers: context.headers,
        },
      );

      const res = await parseResponse(rpc.user.me.$get());
      return res;
    } catch (err) {
      if (err instanceof DetailedError) {
        console.error("Error fetching user:", rpcErrMsg(err));
      }
      return null;
    }
  });
// get user query options
export const userQueryOptions = queryOptions({
  queryKey: queryKeys.user(),
  queryFn: $getUser,
});
