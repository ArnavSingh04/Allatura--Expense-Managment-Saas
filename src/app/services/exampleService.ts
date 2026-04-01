import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

// Example Service Calling https://www.boredapi.com/
export class ExampleService {

  private readonly ENDPOINT = 'api'
  private readonly _apiInstance: ApiHelper;

  constructor() {
    this._apiInstance = new ApiHelper(this.ENDPOINT);
    this._apiInstance.urlParams = "";
  }


  async getActivity() {
    this._apiInstance.type = REQUEST_TYPE.GET;
    this._apiInstance.urlParams = "activity"
    return await this._apiInstance.fetchRequest()
  }

}
