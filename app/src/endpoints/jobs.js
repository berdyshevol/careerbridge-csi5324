// An endpoint is a plain object:
//   path, method  - where it is served (under its namespace)
//   access        - "public" or "private" (private needs a session)
//   roles         - optional list of roles allowed, e.g. ["Applicant"]
//   handler       - receives { body, query, params, auth }, returns data
//   errors        - optional: extra domain error codes -> HTTP status and
//                   message (NOT_FOUND, VALIDATION_ERROR and CONFLICT are
//                   handled by default)
export const createJobEndpoints = (domain) => [
  {
    path: "/",
    method: "GET",
    access: "public",
    handler: () => domain.jobs.listOpen(),
  },
  {
    path: "/:id",
    method: "GET",
    access: "public",
    handler: ({ params }) => domain.jobs.getById(params.id),
  },
];
