import type { NotFoundHandler } from "hono";

const notFoundRoute: NotFoundHandler = (c) => {
  return c.json(
    {
      message: `Route not found - '${c.req.path}'`,
    },
    404,
  );
};

export default notFoundRoute;
