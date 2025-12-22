import {
  ProjectSelectSchema,
  ProjectTokenSelectSchema,
} from "@repo/db/validators/project.validator";
import { describeRoute } from "hono-openapi";
import z from "zod";

import HttpStatusCodes from "@/lib/http-status-codes";
import {
  createErrorResponse,
  createGenericErrorResponse,
  createRateLimitErrorResponse,
  createServerErrorResponse,
  createSuccessResponse,
  getErrDetailsFromErrFields,
} from "@/lib/openapi";
import { authExamples, projectsExamples } from "@/lib/openapi-examples";

const tags = ["Project"];

export const getProjectsDoc = describeRoute({
  description: "Get projects",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Projects retrieved", {
      details: "Projects retrieved successfully",
      dataSchema: z.array(ProjectSelectSchema),
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const createProjectDoc = describeRoute({
  description: "Create a new project",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.CREATED]: createSuccessResponse("Project created", {
      details: "Project created successfully",
      dataSchema: ProjectSelectSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          projectsExamples.createProjectValErrs,
        ),
        fields: projectsExamples.createProjectValErrs,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const getProjectDoc = describeRoute({
  description: "Get a project",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Project retrieved", {
      details: "Project retrieved successfully",
      dataSchema: ProjectSelectSchema.extend({
        tokens: z.array(ProjectTokenSelectSchema),
      }),
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Project not found",
      {
        code: "NOT_FOUND",
        details: "Project not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const updateProjectDoc = describeRoute({
  description: "Update a project",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Project updated", {
      details: "Project updated successfully",
      dataSchema: ProjectSelectSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidProjectID: {
        summary: "Invalid project ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields({
          projectId: "Invalid UUID",
        }),
        fields: {
          projectId: "Invalid UUID",
        },
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          projectsExamples.updateProjectValErrs,
        ),
        fields: projectsExamples.updateProjectValErrs,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Project not found",
      {
        code: "NOT_FOUND",
        details: "Project not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const deleteProjectDoc = describeRoute({
  description: "Delete a project",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Project deleted", {
      details: "Project deleted successfully",
      dataSchema: z.object({
        status: z.literal("ok"),
      }),
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidProjectID: {
        summary: "Invalid project ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields({
          id: "Invalid UUID",
        }),
        fields: {
          id: "Invalid UUID",
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Project not found",
      {
        code: "NOT_FOUND",
        details: "Project not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const createProjectTokenDoc = describeRoute({
  description: "Create a new project token",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.CREATED]: createSuccessResponse("Project token created", {
      details: "Project token created successfully",
      dataSchema: ProjectTokenSelectSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid project ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(authExamples.uuidValErr),
        fields: authExamples.uuidValErr,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          projectsExamples.createProjectTokenValErrs,
        ),
        fields: projectsExamples.createProjectTokenValErrs,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Project not found",
      {
        code: "NOT_FOUND",
        details: "Project not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const updateProjectTokenDoc = describeRoute({
  description: "Update a project token",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Project token updated", {
      details: "Project token updated successfully",
      dataSchema: ProjectTokenSelectSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidProjectOrTokenID: {
        summary: "Invalid project or Token ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields({
          projectId: "Invalid UUID",
          tokenId: "Invalid UUID",
        }),
        fields: {
          projectId: "Invalid UUID",
          tokenId: "Invalid UUID",
        },
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          projectsExamples.updateProjectTokenValErrs,
        ),
        fields: projectsExamples.updateProjectTokenValErrs,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createErrorResponse(
      "Project or token not found",
      {
        projectNotFound: {
          summary: "Project not found",
          code: "PROJECT_NOT_FOUND",
          details: "Project not found",
        },
        tokenNotFound: {
          summary: "Token not found",
          code: "TOKEN_NOT_FOUND",
          details: "Token not found",
        },
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const deleteProjectTokenDoc = describeRoute({
  description: "Delete a project token",
  tags,
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Project token deleted", {
      details: "Project token deleted successfully",
      dataSchema: z.object({
        status: z.literal("ok"),
      }),
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidProjectOrTokenID: {
        summary: "Invalid project or Token ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields({
          projectId: "Invalid UUID",
          tokenId: "Invalid UUID",
        }),
        fields: {
          projectId: "Invalid UUID",
          tokenId: "Invalid UUID",
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createGenericErrorResponse("Unauthorized", {
      code: "UNAUTHORIZED",
      details: "No session found",
    }),
    [HttpStatusCodes.NOT_FOUND]: createErrorResponse(
      "Project or token not found",
      {
        projectNotFound: {
          summary: "Project not found",
          code: "PROJECT_NOT_FOUND",
          details: "Project not found",
        },
        tokenNotFound: {
          summary: "Token not found",
          code: "TOKEN_NOT_FOUND",
          details: "Token not found",
        },
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});
