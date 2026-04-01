export enum REQUEST_TYPE {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export class ApiHelper {

  private _baseURL: string;
  private readonly _apiKey: string;
  private readonly _endpoint: string;
  private _urlParams: string;
  private _requestType: REQUEST_TYPE;
  private _requestBody: any;
  private _includeKey: boolean;

  constructor(endpoint: string) {
    this._baseURL = process.env.BACKEND_API_URL!;
    this._apiKey = process.env.BACKEND_API_KEY!;
    this._endpoint = endpoint;
    this._urlParams = '';
    this._includeKey = true;
    this._requestType = REQUEST_TYPE.GET;
  }

  set baseURL(newBaseURL: string) {
    this._baseURL = newBaseURL;
  }

  set type(requestType: REQUEST_TYPE) {
    this._requestType = requestType;
  }

  set includeKey(includeKey: boolean) {
    this._includeKey = includeKey;
  }

  set urlParams(newUrlParams: string) {
    this._urlParams = newUrlParams;
  }

  set body(newBody: any) {
    this._requestBody = newBody;
  }

  private logReturn(error: string) {
    const response = { failed: true, error: error }
    console.error(response.error);
    return response;
  }

  async fetchRequest() {
    const URL = `${this._baseURL}/${this._endpoint}/${this._urlParams}`;
    //  console.log('--------');
    //  console.log('Base URL: ', URL);
    //  console.log('Request Type: ', this._requestType);
    //  console.log('body', this._requestBody);
    //  console.log('--------');

    const config: RequestInit = {
      ...((this._requestBody !== undefined || this._requestBody !== null) ? { body: JSON.stringify(this._requestBody) } : ''),
      method: this._requestType,
      headers: {
        "content-type": "application/json",
        ...(this._includeKey === true && { 'x-api-key': this._apiKey }),
      }
    }

    //    console.log(config);

    try {
      const response = await fetch(URL, config);
      if (response.status === 401) {
        return this.logReturn('unauthorized.')
      }
      else if (response.status === 404) {
        return this.logReturn('Resource not found.');
      }
      else if (response.status === 500) {
        return this.logReturn('A server error occured.');
      }
      else if (!response.ok) {
        return this.logReturn(`Request could not be submitted status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    }
    catch (error) {
      console.error(`unexpected error occured: ${error}`);
    }
  }
}
