import type { AppRouteHandler } from "@/lib/types";
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
import { errorResponse, successResponse } from "@/utils/api-response";
import { decrypt, encrypt } from "@/utils/encryption";
import HttpStatusCodes from "@/utils/http-status-codes";
import { stripHyphens } from "@/utils/string";
import type {
  CreateProjectRoute,
  CreateProjectTokenRoute,
  DeleteProjectRoute,
  DeleteProjectTokenRoute,
  GetProjectRoute,
  GetProjectsRoute,
  UpdateProjectRoute,
  UpdateProjectTokenRoute,
} from "./projects.routes";

export const getProjects: AppRouteHandler<GetProjectsRoute> = async (c) => {
  const user = c.get("user");

  const projects = await getProjectsForUser(user.id);

  return c.json(
    successResponse(projects, "Projects retrieved successfully"),
    HttpStatusCodes.OK,
  );
};

export const createProject: AppRouteHandler<CreateProjectRoute> = async (c) => {
  const user = c.get("user");
  const { name } = c.req.valid("json");

  const newProject = await createProjectForUser(name, user.id);

  return c.json(
    successResponse(newProject, "Project created successfully"),
    HttpStatusCodes.CREATED,
  );
};

export const getProject: AppRouteHandler<GetProjectRoute> = async (c) => {
  const user = c.get("user");
  const { id: projectId } = c.req.valid("param");

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
};

export const updateProject: AppRouteHandler<UpdateProjectRoute> = async (c) => {
  const user = c.get("user");
  const { id: projectId } = c.req.valid("param");
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
};

export const deleteProject: AppRouteHandler<DeleteProjectRoute> = async (c) => {
  const user = c.get("user");
  const { id: projectId } = c.req.valid("param");

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
};

export const createProjectToken: AppRouteHandler<
  CreateProjectTokenRoute
> = async (c) => {
  const user = c.get("user");
  const { id: projectId } = c.req.valid("param");
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
};

export const updateProjectToken: AppRouteHandler<
  UpdateProjectTokenRoute
> = async (c) => {
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
};

export const deleteProjectToken: AppRouteHandler<
  DeleteProjectTokenRoute
> = async (c) => {
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
};
