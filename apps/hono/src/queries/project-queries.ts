import { and, db, eq } from "@repo/db";
import { project, projectToken } from "@repo/db/schemas/project.schema";
import slugify from "slugify";

import { encrypt } from "../lib/encryption";

/**
 * Get all projects for a user
 * @param userId - The ID of the user
 * @returns An array of projects
 */
export const getProjectsForUser = async (userId: string) => {
  const projects = await db.query.project.findMany({
    where: (project, { eq }) => eq(project.userId, userId),
  });

  return projects;
};

/**
 * Get a project by its token
 * @param token - The token of the project
 * @returns The project with its tokens
 */
export const getProjectByToken = async (token: string) => {
  const encryptedToken = encrypt(token);

  const projectToken = await db.query.projectToken.findFirst({
    where: (projectToken, { eq }) =>
      eq(projectToken.encryptedToken, encryptedToken),
    with: {
      project: true,
    },
  });

  return projectToken;
};

/**
 * Create a new project for a user
 * @param name - Name of the project
 * @param userId - The ID of the user
 * @returns The created project
 */
export const createProjectForUser = async (name: string, userId: string) => {
  // Get user's projects
  const projects = await getProjectsForUser(userId);

  // Generate slug
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 0;
  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingProject = projects.find((p) => p.slug === finalSlug);

    if (!existingProject) {
      slug = finalSlug;
      break;
    }
    counter++;
  }

  // Create project
  const [newProject] = await db
    .insert(project)
    .values({
      name,
      slug,
      userId,
    })
    .returning();

  return newProject;
};

/**
 * Get a single project for a user
 * @param projectId - The ID of the project
 * @param userId - The ID of the user
 * @returns The project with its tokens
 */
export const getSingleProjectForUser = async (
  projectId: string,
  userId: string,
) => {
  const singleProject = await db.query.project.findFirst({
    where: (project, { eq, and }) =>
      and(eq(project.userId, userId), eq(project.id, projectId)),
    with: {
      tokens: true,
    },
  });

  return singleProject;
};

/**
 * Update a project for a user
 * @param name - Name of the project
 * @param projectId - The ID of the project
 * @returns The updated project with its tokens
 */
export const updateProjectForUser = async ({
  name,
  projectId,
}: {
  name: string;
  projectId: string;
}) => {
  const [updatedProject] = await db
    .update(project)
    .set({
      name,
    })
    .where(eq(project.id, projectId))
    .returning();

  if (!updatedProject) {
    return undefined;
  }

  const updatedProjectWithTokens = await db.query.project.findFirst({
    where: eq(project.id, projectId),
    with: {
      tokens: true,
    },
  });

  return updatedProjectWithTokens;
};

/**
 * Delete a project for a user
 * @param projectId - The ID of the project
 * @param userId - The ID of the user
 * @returns The deleted project
 */
export const deleteProjectForUser = async ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  const [deletedProject] = await db
    .delete(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .returning();

  if (!deletedProject) {
    return undefined;
  }

  return deletedProject;
};

/**
 * Create a new project token for a user
 * @param encryptedToken - The encrypted token
 * @param name - The name of the token
 * @param projectId - The ID of the project
 * @returns The created project token
 */
export const createProjectTokenForUser = async ({
  encryptedToken,
  name,
  projectId,
}: {
  encryptedToken: string;
  name: string;
  projectId: string;
}) => {
  const [newProjectToken] = await db
    .insert(projectToken)
    .values({
      name,
      encryptedToken,
      projectId,
    })
    .returning();

  return newProjectToken;
};

/**
 * Get a single project token for a user
 * @param tokenId - The ID of the token
 * @param projectId - The ID of the project
 * @returns The project token
 */
export const getSingleProjectTokenForUser = async (
  tokenId: string,
  projectId: string,
) => {
  const singleProjectToken = await db.query.projectToken.findFirst({
    where: (projectToken, { eq, and }) =>
      and(eq(projectToken.projectId, projectId), eq(projectToken.id, tokenId)),
  });

  return singleProjectToken;
};

export const updateProjectTokenForUser = async ({
  name,
  tokenId,
}: {
  name: string;
  tokenId: string;
}) => {
  const [updatedProjectToken] = await db
    .update(projectToken)
    .set({
      name,
    })
    .where(eq(projectToken.id, tokenId))
    .returning();

  return updatedProjectToken;
};

/**
 * Delete a project token for a user
 * @param projectId - The ID of the project
 * @param tokenId - The ID of the token
 * @returns The deleted project token
 */
export const deleteProjectTokenForUser = async ({
  projectId,
  tokenId,
}: {
  projectId: string;
  tokenId: string;
}) => {
  const [deletedProjectToken] = await db
    .delete(projectToken)
    .where(
      and(eq(projectToken.id, tokenId), eq(projectToken.projectId, projectId)),
    )
    .returning();

  if (!deletedProjectToken) {
    return undefined;
  }

  return deletedProjectToken;
};
