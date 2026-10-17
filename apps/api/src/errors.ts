/** A failure the customer should be told about. `field` names the input it belongs to; `errors` carries one message per input. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, field?: string) => new HttpError(400, message, field);
export const unauthorized = (message = "Please sign in to continue.") => new HttpError(401, message);
export const forbidden = (message: string) => new HttpError(403, message);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string, field?: string) => new HttpError(409, message, field);
export const unavailable = (message: string) => new HttpError(503, message);
