import { db, eq } from "@repo/db";
import { project, projectToken } from "@repo/db/schemas/project.schema";
import slugify from "slugify";

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
 * @param projectId - The ID of the project
 * @param userId - The ID of the user
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
