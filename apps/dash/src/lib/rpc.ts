import type app from "@repo/rpc";
import { getRequest } from "@tanstack/react-start/server";
import type { DetailedError } from "hono/client";
import { hc } from "hono/client";

const request = getRequest();
request.headers.delete("host");
const headers = Object.fromEntries(request.headers.entries());

export type Client = ReturnType<typeof hc<typeof app>>;
const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args);

export const { api: rpc } = hcWithType("http://localhost:5000", {
  init: {
    credentials: "include",
  },
  headers,
});

export const rpcErrMsg = (err: DetailedError) => {
  return {
    status: err.statusCode,
    statusText: err.detail.statusText,
    data: err.detail.data,
  };
};
