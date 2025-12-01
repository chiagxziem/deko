export const authExamples = {
  emailValErr: {
    email: "Invalid email address",
  },
  uuidValErr: {
    id: "Invalid UUID",
  },
};

export const projectsExamples = {
  project: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Sample project",
    userId: "123e4567-e89b-12d3-a456-426614174000",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  createProjectValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
  projectToken: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    projectId: "123e4567-e89b-12d3-a456-426614174000",
    name: "Sample Token",
    token: "123e4567e89b12d3a456426614174000",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
    lastUsedAt: "2025-08-11T18:26:20.296Z",
  },
  createProjectTokenValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
  updateProjectTokenValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};
