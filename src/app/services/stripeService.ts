import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

/** JSON from GET stripe/session/:id */
export type StripeSessionResult = {
  failed?: boolean;
  error?: string;
  stripeSubscriptionID?: string;
  stripeCustomerID?: string;
};

/** JSON from GET stripe/subscription/:id */
export type StripeSubscriptionResult = {
  failed?: boolean;
  error?: string;
  priceID?: string;
  productID?: string;
  planName?: string;
};

export class StripeService {

  private readonly ENDPOINT = 'stripe'
  private readonly _apiInstance: ApiHelper;

  constructor() {
    this._apiInstance = new ApiHelper(this.ENDPOINT);
    this._apiInstance.urlParams = "";
  }

  async getSession(sessionID: string): Promise<StripeSessionResult> {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `session/${sessionID}`;
    return (await this._apiInstance.fetchRequest()) as StripeSessionResult;
  }

  async getSubscription(subscriptionID: string): Promise<StripeSubscriptionResult> {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `subscription/${subscriptionID}`;
    return (await this._apiInstance.fetchRequest()) as StripeSubscriptionResult;
  }

  async deleteSubscription(subscriptionID: string) {
    this._apiInstance.urlParams = "";
    this._apiInstance.urlParams = `subscription/${subscriptionID}`;
    this._apiInstance.type = REQUEST_TYPE.DELETE;
    return await this._apiInstance.fetchRequest()
  }

}