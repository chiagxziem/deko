import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { project, projectToken } from "../schemas/project.schema";

export const ProjectSelectSchema = createSelectSchema(project);

export const ProjectInsertSchema = createInsertSchema(project).pick({
  name: true,
});

export const ProjectTokenSelectSchema = createSelectSchema(projectToken)
  .omit({
    encryptedToken: true,
  })
  .extend({
    token: z.string().min(1),
  });

export const ProjectTokenInsertSchema = createInsertSchema(projectToken).pick({
  name: true,
});

export const ProjectTokenUpdateSchema = ProjectTokenInsertSchema;
