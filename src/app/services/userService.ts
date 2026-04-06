import { ApiHelper, REQUEST_TYPE } from "@/lib/api-helper";

/** JSON from GET /user — fields depend on backend response */
export type UserApiResult = {
  found?: boolean;
  failed?: boolean;
  error?: string;
  id?: string;
  authID?: string;
  email?: string;
};

export class UserService {

  private readonly ENDPOINT = 'user'
  private readonly _apiInstance: ApiHelper;

  constructor() {
    this._apiInstance = new ApiHelper(this.ENDPOINT);
    this._apiInstance.urlParams = '';
  }

  async getUser(authID: string): Promise<UserApiResult> {
    this._apiInstance.type = REQUEST_TYPE.GET;
    this._apiInstance.urlParams = '';
    this._apiInstance.urlParams = authID;
    return (await this._apiInstance.fetchRequest()) as UserApiResult;
  }

  async getUserByID(id: string): Promise<UserApiResult> {
    this._apiInstance.type = REQUEST_TYPE.GET;
    this._apiInstance.urlParams = '';
    this._apiInstance.urlParams = `id/${id}`;
    return (await this._apiInstance.fetchRequest()) as UserApiResult;
  }

  async createUser(user: any) {
    this._apiInstance.type = REQUEST_TYPE.POST;
    this._apiInstance.urlParams = '';
    this._apiInstance.body = user;
    return await this._apiInstance.fetchRequest();
  }

}


