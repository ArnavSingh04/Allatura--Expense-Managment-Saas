import { REQUEST_TYPE } from "@/lib/api-helper";
import { FrontendService } from "@/services/frontendService";

export const submitRequest = async (payload: any, url: string, requestType?: REQUEST_TYPE) => {
  const defaultRequestType = requestType ? requestType : REQUEST_TYPE.POST;
  const frontendService = new FrontendService(url);
  return await frontendService.sendRequest(defaultRequestType, payload);
}