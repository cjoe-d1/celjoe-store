export type ErrorCode =
  | "validation_error"
  | "auth_error"
  | "permission_error"
  | "not_found"
  | "rate_limited"
  | "network_error"
  | "unknown_error";

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(message: string, code: ErrorCode, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message, "unknown_error");
  return new AppError("Unknown error", "unknown_error");
};

