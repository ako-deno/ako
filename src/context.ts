import { ServerRequest, Response as ServerResponse } from "../deps.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

export class Context {
  request: Request;
  response: Response;
  req: ServerRequest;
  res: ServerResponse;

  constructor(request: Request, response: Response) {
    this.request = request;
    this.response = response;
    this.req = request.req;
    this.res = response.res;
  }

  [key: string]: any
}
