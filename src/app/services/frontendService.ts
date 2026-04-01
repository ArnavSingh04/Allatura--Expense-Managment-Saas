import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

export class FrontendService {

  private readonly _endpoint;
  private readonly _apiInstance: ApiHelper;
  private readonly BASE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

  constructor( endpoint: string ) {
    this._endpoint = endpoint;
    this._apiInstance = new ApiHelper(this._endpoint);
    this._apiInstance.includeKey = false;
    this._apiInstance.baseURL = this.BASE_URL;
  }

  async sendRequest(requestType: REQUEST_TYPE, body?: any ) {
    this._apiInstance.type = requestType;
    if(body) {
      this._apiInstance.body = body;
    }
    return await this._apiInstance.fetchRequest();
  }

}
