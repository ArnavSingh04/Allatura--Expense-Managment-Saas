import { getJwtClaims } from "@/lib/jwt";

export enum REQUEST_TYPE {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

function apiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.BACKEND_API_URL ||
    "";
  return url.replace(/\/$/, "");
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("plutus_access_token");
}

function authHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {};
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const tenantId = getJwtClaims(token)?.tenantId;
  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }
  return headers;
}

function cookieSecureSuffix(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:"
    ? "; Secure"
    : "";
}

export function setAuthToken(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("plutus_access_token", token);
  const secure = cookieSecureSuffix();
  document.cookie = `plutus_access_token=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("plutus_access_token");
  const secure = cookieSecureSuffix();
  document.cookie = `plutus_access_token=; path=/; max-age=0; SameSite=Lax${secure}`;
}

export class ApiHelper {
  private _baseURL: string;
  private readonly _apiKey: string;
  private readonly _endpoint: string;
  private _urlParams: string;
  private _requestType: REQUEST_TYPE;
  private _requestBody: unknown;
  private _includeKey: boolean;
  /**
   * When true, do not send Bearer / x-tenant-id from localStorage.
   * Use for @Public() routes like auth/login and auth/register so a stale JWT
   * from another session does not make the API reject the request with 401.
   */
  private _skipSessionHeaders: boolean;

  constructor(endpoint: string) {
    this._baseURL = apiBaseUrl();
    this._apiKey = process.env.BACKEND_API_KEY || "";
    this._endpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");
    this._urlParams = "";
    this._includeKey = true;
    this._requestType = REQUEST_TYPE.GET;
    this._skipSessionHeaders = false;
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

  set skipSessionHeaders(skip: boolean) {
    this._skipSessionHeaders = skip;
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
    const token = getStoredToken();
    const headers: Record<string, string> = {
      ...(this._includeKey === true &&
        this._apiKey && { "x-api-key": this._apiKey }),
    };
    if (!this._skipSessionHeaders) {
      Object.assign(headers, authHeaders(token));
    }
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
        // #region agent log
        fetch("http://127.0.0.1:7325/ingest/3c71a81a-d4c8-4e9d-9fd0-2c75fba097b2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "0af2d5",
          },
          body: JSON.stringify({
            sessionId: "0af2d5",
            hypothesisId: "A",
            location: "api-helper.ts:fetchRequest:404",
            message: "API returned 404",
            data: {
              url: URL,
              method: this._requestType,
              endpoint: this._endpoint,
            },
            timestamp: Date.now(),
            runId: "contracts-debug",
          }),
        }).catch(() => {});
        // #endregion
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
    const token = getStoredToken();
    const headers: Record<string, string> = {
      ...(this._includeKey === true &&
        this._apiKey && { "x-api-key": this._apiKey }),
    };
    if (!this._skipSessionHeaders) {
      Object.assign(headers, authHeaders(token));
    }

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
