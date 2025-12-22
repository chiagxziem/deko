export const authExamples = {
  emailValErr: {
    email: "Invalid email address",
  },
  uuidValErr: {
    id: "Invalid UUID",
  },
};

export const userExamples = {
  user: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "User",
    email: "user@example.com",
    emailVerified: true,
    image: "https://example.com/image.png",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  updateUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};

export const logsExamples = {
  log: {
    projectToken: "123e4567e89b12d3a456426614174000",
    method: "get",
    path: "/test-path",
    status: 200,
    timestamp: "2025-08-11T18:26:20.296Z",
    duration: 100,
    env: "development",
    sessionId: "123e4567-e89b-12d3-a456-426614174000",
    level: "info",
    message: "Test message",
    meta: {
      test: "test",
    },
  },
  ingestLogValErrs: {
    projectToken: "Too small: expected string to have >=1 characters",
    method:
      'Invalid option: expected one of "get"|"head"|"post"|"put"|"patch"|"delete"|"connect"|"options"|"trace"',
    path: "Too small: expected string to have >=1 characters",
    status: "Invalid input: expected number, received string",
    duration: "Invalid input: expected number, received string",
    env: "Too small: expected string to have >=1 characters",
    sessionId: "Invalid input: expected string, received number",
    level: 'Invalid option: expected one of "debug"|"info"|"warn"|"error"',
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
  updateProjectValErrs: {
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
