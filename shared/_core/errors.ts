export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}
