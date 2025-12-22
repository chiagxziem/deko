export const authExamples = {
  emailValErr: {
    email: "Invalid email address",
  },
  uuidValErr: {
    id: "Invalid UUID",
  },
};

export const userExamples = {
  updateUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};

export const logsExamples = {
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
  createProjectValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
  updateProjectValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
  createProjectTokenValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
  updateProjectTokenValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};
