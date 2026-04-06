import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

/** JSON from account endpoints — fields depend on backend response */
export type AccountApiResult = {
  found?: boolean;
  failed?: boolean;
  error?: string;
  id?: string;
  stripeSubscriptionID?: string;
};

export class AccountService {

  private readonly ENDPOINT = 'account'
  private readonly _apiInstance: ApiHelper;

  constructor() {
    this._apiInstance = new ApiHelper(this.ENDPOINT);
    this._apiInstance.urlParams = "";
  }

  private resetParams() {
    this._apiInstance.urlParams = '';
    this._apiInstance.body = undefined;
  }

  async getAccount(searchParam: string, id: string): Promise<AccountApiResult> {
    this._apiInstance.type = REQUEST_TYPE.GET;
    this._apiInstance.urlParams = '';
    this._apiInstance.urlParams = `${searchParam}/${id}`;
    return (await this._apiInstance.fetchRequest()) as AccountApiResult;
  }

  async createAccount(account: any): Promise<AccountApiResult> {
    this.resetParams();
    this._apiInstance.type = REQUEST_TYPE.POST;
    this._apiInstance.body = account;
    return (await this._apiInstance.fetchRequest()) as AccountApiResult;
  }

  async updateAccount(accountID: string, account: any): Promise<AccountApiResult> {
    this.resetParams();
    this._apiInstance.type = REQUEST_TYPE.PATCH;
    this._apiInstance.urlParams = accountID;
    this._apiInstance.body = account;
    return (await this._apiInstance.fetchRequest()) as AccountApiResult;
  }

}


