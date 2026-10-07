const errors = {
  NOT_FOUND: { code: 404, message: "Job posting not found" },
};

// An endpoint is a plain object:
//   path, method  - where it is served (under its namespace)
//   access        - "public" or "private" (private needs a session)
//   roles         - optional list of roles allowed, e.g. ["Applicant"]
//   handler       - receives { body, query, params, auth }, returns data
//   errors        - domain error code -> HTTP status and message
export const createJobEndpoints = (domain) => [
  {
    path: "/",
    method: "GET",
    access: "public",
    handler: () => domain.jobs.listOpen(),
    errors,
  },
  {
    path: "/:id",
    method: "GET",
    access: "public",
    handler: ({ params }) => domain.jobs.getById(params.id),
    errors,
  },
];
