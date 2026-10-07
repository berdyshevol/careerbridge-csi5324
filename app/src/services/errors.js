export const DOMAIN_ERRORS = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
};

// Thrown by services. Endpoints map the code to an HTTP status.
export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
