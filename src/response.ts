import {
  Response as ServerResponse,
} from "../deps.ts";
import { Application } from "./application.ts";

class Response {
  res: ServerResponse;
  app: Application;
  constructor(res: ServerResponse, app: Application) {
    this.res = res;
    this.app = app;
  }

  /**
   * Get response status code.
   *
   * @return {Number|Undefined}
   * @api public
   */

  get status(): number | undefined {
    return this.res.status;
  }

  /**
   * Set response status code.
   *
   * @param {Number|Undefined} code
   * @api public
   */

  set status(code: number | undefined) {
    this.res.status = code;
  }
}

export { Response };
