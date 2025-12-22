import crypto from "node:crypto";

import {
  ProjectInsertSchema,
  ProjectTokenInsertSchema,
} from "@repo/db/validators/project.validator";
import { validator } from "hono-openapi";
import z from "zod";

import { createRouter } from "@/app";
import { decrypt, encrypt } from "@/lib/encryption";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, stripHyphens, successResponse } from "@/lib/utils";
import { authed } from "@/middleware/authed";
import { validationHook } from "@/middleware/validation-hook";
import {
  createProjectForUser,
  createProjectTokenForUser,
  deleteProjectForUser,
  deleteProjectTokenForUser,
  getProjectsForUser,
  getSingleProjectForUser,
  getSingleProjectTokenForUser,
  updateProjectForUser,
  updateProjectTokenForUser,
} from "@/queries/project-queries";
import {
  createProjectDoc,
  createProjectTokenDoc,
  deleteProjectDoc,
  deleteProjectTokenDoc,
  getProjectDoc,
  getProjectsDoc,
  updateProjectDoc,
  updateProjectTokenDoc,
} from "./project.docs";

const project = createRouter().use(authed);

// Get all projects
project.get("/", getProjectsDoc, async (c) => {
  const user = c.get("user");
  const projects = await getProjectsForUser(user.id);

  return c.json(
    successResponse(projects, "Projects retrieved successfully"),
    HttpStatusCodes.OK,
  );
});

// Create project
project.post(
  "/",
  createProjectDoc,
  validator("json", ProjectInsertSchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const { name } = c.req.valid("json");

    const newProject = await createProjectForUser(name, user.id);

    return c.json(
      successResponse(newProject, "Project created successfully"),
      HttpStatusCodes.CREATED,
    );
  },
);

// Get single project
project.get(
  "/:id",
  getProjectDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  async (c) => {
    const user = c.get("user");
    const projectId = c.req.valid("param").id;

    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Decrypt encrypted project tokens
    const projectTokens = project.tokens.map((pt) => {
      const { encryptedToken, ...token } = pt;

      return {
        ...token,
        token: decrypt(encryptedToken),
      };
    });

    const projectWithDecryptedTokens = {
      ...project,
      tokens: projectTokens,
    };

    return c.json(
      successResponse(
        projectWithDecryptedTokens,
        "Project retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Update project
project.patch(
  "/:id",
  updateProjectDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  validator("json", ProjectInsertSchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const projectId = c.req.valid("param").id;
    const { name } = c.req.valid("json");

    // Get project
    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Decrypt encrypted project tokens
    const projectTokens = project.tokens.map((pt) => {
      const { encryptedToken, ...token } = pt;

      return {
        ...token,
        token: decrypt(encryptedToken),
      };
    });

    const projectWithDecryptedTokens = {
      ...project,
      tokens: projectTokens,
    };

    // Return success if the name didn't change
    if (name === project.name) {
      return c.json(
        successResponse(
          projectWithDecryptedTokens,
          "Project updated successfully",
        ),
        HttpStatusCodes.OK,
      );
    }

    // Update project name
    const updatedProject = await updateProjectForUser({
      name,
      projectId,
    });

    if (!updatedProject) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Decrypt encrypted project tokens
    const updatedProjectTokens = updatedProject.tokens.map((pt) => {
      const { encryptedToken, ...token } = pt;

      return {
        ...token,
        token: decrypt(encryptedToken),
      };
    });

    const updatedProjectWithDecryptedTokens = {
      ...updatedProject,
      tokens: updatedProjectTokens,
    };

    return c.json(
      successResponse(
        updatedProjectWithDecryptedTokens,
        "Project updated successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Delete project
project.delete(
  "/:id",
  deleteProjectDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  async (c) => {
    const user = c.get("user");
    const projectId = c.req.valid("param").id;

    // Get project
    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const deletedProject = await deleteProjectForUser({
      projectId,
      userId: user.id,
    });

    if (!deletedProject) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse({ status: "ok" }, "Project deleted successfully"),
      HttpStatusCodes.OK,
    );
  },
);

// Create project token
project.post(
  "/:id/tokens",
  createProjectTokenDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  validator("json", ProjectTokenInsertSchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const projectId = c.req.valid("param").id;
    const { name } = c.req.valid("json");

    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Generate random project token string
    const projectTokenStr = stripHyphens(crypto.randomUUID());
    const encryptedProjectTokenStr = encrypt(projectTokenStr);

    // Create new project token
    const { encryptedToken: _et, ...newProjectToken } =
      await createProjectTokenForUser({
        name,
        encryptedToken: encryptedProjectTokenStr,
        projectId,
      });

    const newDecryptedProjectToken = {
      ...newProjectToken,
      token: projectTokenStr,
    };

    return c.json(
      successResponse(
        newDecryptedProjectToken,
        "Project token created successfully",
      ),
      HttpStatusCodes.CREATED,
    );
  },
);

// Update project token
project.patch(
  "/:projectId/tokens/:tokenId",
  updateProjectTokenDoc,
  validator(
    "param",
    z.object({ projectId: z.uuid(), tokenId: z.uuid() }),
    validationHook,
  ),
  validator("json", ProjectTokenInsertSchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const { projectId, tokenId } = c.req.valid("param");
    const { name } = c.req.valid("json");

    // Get project
    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("PROJECT_NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get token
    const encryptedProjectToken = await getSingleProjectTokenForUser(
      tokenId,
      projectId,
    );

    if (!encryptedProjectToken) {
      return c.json(
        errorResponse("TOKEN_NOT_FOUND", "Token not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Decrypt token str
    const { encryptedToken, ...newProjectToken } = encryptedProjectToken;

    const decryptedProjectToken = {
      ...newProjectToken,
      token: decrypt(encryptedToken),
    };

    // Return success if the name didn't change
    if (name === decryptedProjectToken.name) {
      return c.json(
        successResponse(
          decryptedProjectToken,
          "Project token updated successfully",
        ),
        HttpStatusCodes.OK,
      );
    }

    // Update project token name
    const { encryptedToken: updatedEncryptedToken, ...updatedProjectToken } =
      await updateProjectTokenForUser({
        tokenId,
        name,
      });

    // Decrypt token str of updated project token
    const updatedDecryptedProjectToken = {
      ...updatedProjectToken,
      token: decrypt(updatedEncryptedToken),
    };

    return c.json(
      successResponse(
        updatedDecryptedProjectToken,
        "Project token updated successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Delete project token
project.delete(
  "/:projectId/tokens/:tokenId",
  deleteProjectTokenDoc,
  validator(
    "param",
    z.object({ projectId: z.uuid(), tokenId: z.uuid() }),
    validationHook,
  ),
  async (c) => {
    const user = c.get("user");
    const { projectId, tokenId } = c.req.valid("param");

    // Get project
    const project = await getSingleProjectForUser(projectId, user.id);

    if (!project) {
      return c.json(
        errorResponse("PROJECT_NOT_FOUND", "Project not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get token
    const projectToken = await getSingleProjectTokenForUser(tokenId, projectId);

    if (!projectToken) {
      return c.json(
        errorResponse("TOKEN_NOT_FOUND", "Token not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Delete project token
    const deletedProjectToken = await deleteProjectTokenForUser({
      projectId,
      tokenId,
    });

    if (!deletedProjectToken) {
      return c.json(
        errorResponse("TOKEN_NOT_FOUND", "Token not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse(
        {
          status: "ok",
        },
        "Project token deleted successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

export default project;
