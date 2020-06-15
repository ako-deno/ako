import {
  Application,
} from "../../mod.ts";
import { ServerRequest, Response } from "../../deps.ts";

export function context(
  req?: ServerRequest,
  res?: Response,
  app?: Application,
) {
  req = Object.assign({ headers: new Headers() }, req);
  res = Object.assign({ headers: new Headers() }, res);
  app = app || new Application();
  return app.createContext(req, res);
}

export function request(
  req?: ServerRequest,
  res?: Response,
  app?: Application,
) {
  return context(req, res, app).request;
}

export function response(
  req?: ServerRequest,
  res?: Response,
  app?: Application,
) {
  return context(req, res, app).response;
}
