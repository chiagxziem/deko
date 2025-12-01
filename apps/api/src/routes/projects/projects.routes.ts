import { createRoute, z } from "@hono/zod-openapi";
import {
  ProjectInsertSchema,
  ProjectSelectSchema,
  ProjectTokenInsertSchema,
  ProjectTokenSelectSchema,
  ProjectTokenUpdateSchema,
} from "@repo/db/validators/project.validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { authExamples, projectsExamples } from "@/utils/openapi-examples";
import {
  createIdUUIDParamsSchema,
  errorContent,
  genericErrorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Projects"];

export const getProjects = createRoute({
  path: "/projects",
  method: "get",
  tags,
  description: "Get projects",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Projects retrieved",
      schema: z.array(ProjectSelectSchema),
      resObj: {
        details: "Projects retrieved successfully",
        data: [projectsExamples.project],
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const createProject = createRoute({
  path: "/projects",
  method: "post",
  tags,
  description: "Create a new project",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ProjectInsertSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Project created",
      schema: ProjectSelectSchema,
      resObj: {
        details: "Project created successfully",
        data: projectsExamples.project,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            projectsExamples.createProjectValErrs,
          ),
          fields: projectsExamples.createProjectValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const getProject = createRoute({
  path: "/projects/{id}",
  method: "get",
  tags,
  description: "Get project",
  request: {
    params: createIdUUIDParamsSchema({
      id: "Project ID",
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Project retrieved",
      schema: ProjectSelectSchema.extend({
        tokens: z.array(ProjectTokenSelectSchema),
      }),
      resObj: {
        details: "Project retrieved successfully",
        data: {
          project: {
            ...projectsExamples.project,
            tokens: [projectsExamples.projectToken],
          },
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Project not found",
      "Project not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const createProjectToken = createRoute({
  path: "/projects/{id}/tokens",
  method: "post",
  tags,
  description: "Create a new project token",
  request: {
    params: createIdUUIDParamsSchema({
      id: "Project ID",
    }),
    body: {
      content: {
        "application/json": {
          schema: ProjectTokenInsertSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: successContent({
      description: "Project token created",
      schema: ProjectTokenSelectSchema,
      resObj: {
        details: "Project token created successfully",
        data: projectsExamples.projectToken,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        invalidUUID: {
          summary: "Invalid project ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(authExamples.uuidValErr),
          fields: authExamples.uuidValErr,
        },
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            projectsExamples.createProjectTokenValErrs,
          ),
          fields: projectsExamples.createProjectTokenValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: genericErrorContent(
      "NOT_FOUND",
      "Project not found",
      "Project not found",
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export const updateProjectToken = createRoute({
  path: "/projects/{projectId}/tokens/{tokenId}",
  method: "patch",
  tags,
  description: "Update a project token",
  request: {
    params: createIdUUIDParamsSchema({
      projectId: "Project ID",
      tokenId: "Token ID",
    }),
    body: {
      content: {
        "application/json": {
          schema: ProjectTokenUpdateSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Project token updated",
      schema: ProjectTokenSelectSchema,
      resObj: {
        details: "Project token updated successfully",
        data: projectsExamples.projectToken,
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
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
        invalidTokenID: {
          summary: "Invalid Token ID",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields({
            tokenId: "Invalid UUID",
          }),
          fields: {
            tokenId: "Invalid UUID",
          },
        },
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(
            projectsExamples.updateProjectTokenValErrs,
          ),
          fields: projectsExamples.updateProjectTokenValErrs,
        },
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: genericErrorContent(
      "UNAUTHORIZED",
      "Unauthorized",
      "No session found",
    ),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Project or token not found",
      examples: {
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
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type GetProjectsRoute = typeof getProjects;
export type CreateProjectRoute = typeof createProject;
export type GetProjectRoute = typeof getProject;
export type CreateProjectTokenRoute = typeof createProjectToken;
export type UpdateProjectTokenRoute = typeof updateProjectToken;
