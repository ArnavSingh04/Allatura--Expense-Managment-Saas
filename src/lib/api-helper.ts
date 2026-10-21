import { resolveApiBaseUrl } from "@/lib/resolve-api-base-url";

export enum REQUEST_TYPE {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

function apiBaseUrl(): string {
  // Delegate to the shared resolver so browser calls go through the same-origin
  // /api/v1 proxy (which injects the Auth0 RS256 token) instead of hitting the
  // API origin directly with the stale HS256 localStorage token → 401.
  return resolveApiBaseUrl().replace(/\/$/, "");
}

// Authentication is handled entirely server-side: the browser calls the
// same-origin /api/v1 proxy, which reads the Auth0 access token from the
// encrypted session cookie and forwards it as a Bearer token. The access token
// is never exposed to client JavaScript, so there is nothing for this module to
// store or attach. The previous setAuthToken/clearAuthToken/getStoredToken
// helpers (a leftover of the pre-Auth0 local-JWT design) wrote a bearer token to
// localStorage and to a non-HttpOnly cookie; they had no callers and have been
// removed rather than left waiting to be wired up again.

export class ApiHelper {
  private _baseURL: string;
  private readonly _apiKey: string;
  private readonly _endpoint: string;
  private _urlParams: string;
  private _requestType: REQUEST_TYPE;
  private _requestBody: unknown;
  private _includeKey: boolean;

  constructor(endpoint: string) {
    this._baseURL = apiBaseUrl();
    this._apiKey = process.env.BACKEND_API_KEY || "";
    this._endpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
    this._urlParams = "";
    this._includeKey = true;
    this._requestType = REQUEST_TYPE.GET;
  }

  set baseURL(newBaseURL: string) {
    this._baseURL = newBaseURL.replace(/\/$/, "");
  }

  set type(requestType: REQUEST_TYPE) {
    this._requestType = requestType;
  }

  set includeKey(includeKey: boolean) {
    this._includeKey = includeKey;
  }

  set urlParams(newUrlParams: string) {
    this._urlParams = newUrlParams.replace(/^\/+/, "");
  }

  set body(newBody: unknown) {
    this._requestBody = newBody;
  }

  private logReturn(error: string) {
    const response = { failed: true, error: error };
    console.error(response.error);
    return response;
  }

  /**
   * Pull the backend's error code/message out of a non-OK response so the UI
   * can show something more useful than a bare HTTP status. Nest's exceptions
   * serialize as `{ statusCode, message, error }` where `message` is either a
   * string (our case — we throw `new ConflictException('email_already_registered')`)
   * or an array of validation errors.
   */
  private async extractErrorMessage(
    response: Response,
    fallback: string,
  ): Promise<string> {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      return fallback;
    }
    if (!bodyText) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(bodyText) as {
        message?: string | string[];
        error?: string;
      };
      if (Array.isArray(parsed.message) && parsed.message.length > 0) {
        return parsed.message.join(", ");
      }
      if (typeof parsed.message === "string" && parsed.message.length > 0) {
        return parsed.message;
      }
      if (typeof parsed.error === "string" && parsed.error.length > 0) {
        return parsed.error;
      }
    } catch {
      if (bodyText.length < 200) {
        return bodyText;
      }
    }
    return fallback;
  }

  private buildUrl(): string {
    const base = this._baseURL;
    const parts = [this._endpoint, this._urlParams].filter((p) => p && p.length > 0);
    const path = parts.join("/");
    return `${base}/${path}`;
  }

  async fetchRequest(): Promise<unknown> {
    if (!this._baseURL) {
      return this.logReturn(
        "API URL is not configured. Set NEXT_PUBLIC_BACKEND_API_URL in .env.local and restart the dev server.",
      );
    }
    const URL = this.buildUrl();
    const headers: Record<string, string> = {
      ...(this._includeKey === true &&
        this._apiKey && { "x-api-key": this._apiKey }),
    };
    const hasJsonBody =
      this._requestBody !== undefined &&
      this._requestBody !== null &&
      (this._requestType === REQUEST_TYPE.POST ||
        this._requestType === REQUEST_TYPE.PATCH);
    if (hasJsonBody) {
      headers["content-type"] = "application/json";
    }

    const config: RequestInit = {
      method: this._requestType,
      headers,
      ...(hasJsonBody && { body: JSON.stringify(this._requestBody) }),
    };

    try {
      const response = await fetch(URL, config);
      if (response.status === 401) {
        const detail = await this.extractErrorMessage(response, "unauthorized.");
        return this.logReturn(detail);
      } else if (response.status === 404) {
        return this.logReturn("Resource not found.");
      } else if (response.status === 500) {
        const detail = await this.extractErrorMessage(
          response,
          "A server error occured.",
        );
        return this.logReturn(detail);
      } else if (!response.ok) {
        const detail = await this.extractErrorMessage(
          response,
          `Request could not be submitted status: ${response.status}`,
        );
        return this.logReturn(detail);
      }

      const text = await response.text();
      if (!text) {
        return {};
      }
      return JSON.parse(text) as unknown;
    } catch (error) {
      console.error(`unexpected error occured: ${error}`, { url: URL });
      return this.logReturn(
        "Cannot reach the API. Start the backend (e.g. npm run start:dev in plutus-be) and check NEXT_PUBLIC_BACKEND_API_URL.",
      );
    }
  }

  /** Multipart POST (e.g. CSV import). Do not set .body, pass FormData here. */
  async fetchMultipart(formData: FormData): Promise<unknown> {
    if (!this._baseURL) {
      return this.logReturn(
        "API URL is not configured. Set NEXT_PUBLIC_BACKEND_API_URL in .env.local and restart the dev server.",
      );
    }
    const URL = this.buildUrl();
    const headers: Record<string, string> = {
      ...(this._includeKey === true &&
        this._apiKey && { "x-api-key": this._apiKey }),
    };

    try {
      const response = await fetch(URL, {
        method: "POST",
        headers,
        body: formData,
      });
      if (response.status === 401) {
        const detail = await this.extractErrorMessage(response, "unauthorized.");
        return this.logReturn(detail);
      }
      if (!response.ok) {
        const detail = await this.extractErrorMessage(
          response,
          `Request could not be submitted status: ${response.status}`,
        );
        return this.logReturn(detail);
      }
      const text = await response.text();
      if (!text) {
        return {};
      }
      return JSON.parse(text) as unknown;
    } catch (error) {
      console.error(`unexpected error occured: ${error}`, { url: URL });
      return this.logReturn(
        "Cannot reach the API. Start the backend (e.g. npm run start:dev in plutus-be) and check NEXT_PUBLIC_BACKEND_API_URL.",
      );
    }
  }
}
