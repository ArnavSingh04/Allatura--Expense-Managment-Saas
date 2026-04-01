import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

export class StripeService {

  private readonly ENDPOINT = 'stripe'
  private readonly _apiInstance: ApiHelper;

  constructor() {
    this._apiInstance = new ApiHelper(this.ENDPOINT);
    this._apiInstance.urlParams = "";
  }

  async getSession(sessionID: string) {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `session/${sessionID}`;
    return await this._apiInstance.fetchRequest()
  }

  async getSubscription(subscriptionID: string) {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `subscription/${subscriptionID}`;
    return await this._apiInstance.fetchRequest()
  }

  async deleteSubscription(subscriptionID: string) {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `subscription/${subscriptionID}`;
    this._apiInstance.type = REQUEST_TYPE.DELETE;
    return await this._apiInstance.fetchRequest()
  }

}