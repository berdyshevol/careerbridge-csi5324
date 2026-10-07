export const DOMAIN_ERRORS = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
};

// Thrown by services. The adapter maps the code to an HTTP status and
// sends the message to the client, so write messages a user may read.
export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
