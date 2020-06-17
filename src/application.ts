/**
(The MIT License)

Copyright (c) 2019 Koa contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import {
  serve,
  Server,
  HTTPOptions,
  ServerRequest,
  Response as ServerResponse,
  EventEmitter,
  debug,
} from "../deps.ts";
import { compose, ComposedMiddleware } from "./compose.ts";
import { context } from "./context.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import {
  BaseRequest,
  DefaultState,
  DefaultContext,
  Middleware,
  ParameterizedContext,
  IApplication,
  BaseResponse,
  BaseContext,
} from "./koa_type.ts";
import {
  byteLength,
  statusEmpty,
  isReader,
  closeReader,
} from "./utill.ts";

const appDebug = debug("ako:application");

interface ApplicationOptions {
  proxy?: boolean;
  proxyIpHeader?: string;
  maxIpsCount?: number;
  env?: string;
  subdomainOffset?: number;
}

class Application<
  StateT = DefaultState,
  CustomT = DefaultContext,
> extends EventEmitter implements IApplication<StateT, CustomT> {
  constructor(options?: ApplicationOptions) {
    super();
    if (options) {
      if (options.proxy) {
        this.proxy = options.proxy;
      }
      if (options.proxyIpHeader) {
        this.proxyIpHeader = options.proxyIpHeader;
      }
      if (options.maxIpsCount) {
        this.maxIpsCount = options.maxIpsCount;
      }
      if (options.env) {
        this.env = options.env;
      } else if (Deno.env.get("DENO_ENV") !== undefined) {
        this.env = Deno.env.get("DENO_ENV")!;
      }
      if (options.subdomainOffset) {
        this.subdomainOffset = options.subdomainOffset || 2;
      }
    }

    this.middleware = [];
    this.request = Object.create(Request);
    this.response = Object.create(Response);
    this.context = Object.create(context);
  }

  middleware: Middleware<StateT, CustomT>[];
  request: BaseRequest;
  response: BaseResponse;
  context: BaseContext & CustomT;
  proxy: boolean = false;
  proxyIpHeader: string = "X-Forwarded-For";
  maxIpsCount: number = 0;
  env: string = "development";
  subdomainOffset: number = 2;
  silent: undefined | boolean = undefined;

  private async handle(server: Server): Promise<void> {
    const httpHandler = this.callback();
    for await (const req of server) {
      const res: ServerResponse = {
        headers: new Headers(),
      };
      appDebug("handle request start");
      await httpHandler(req, res);
      closeReader(res.body);
      appDebug("handle request end");
    }
  }

  /**
   * Return a request handler callback
   * for Deno's std http server.
   *
   * @return {HttpHandler}
   * @api public
   */

  callback(): (req: ServerRequest, res: ServerResponse) => Promise<any> {
    const fn = compose(this.middleware);

    if (!this.listenerCount("error")) this.on("error", this.onerror);

    const handleRequest = (req: ServerRequest, res: ServerResponse) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    return handleRequest;
  }

  /**
   * Handle request in callback.
   *
   * @api private
   */

  private handleRequest(
    ctx: ParameterizedContext<StateT, CustomT>,
    fnMiddleware: ComposedMiddleware<ParameterizedContext<StateT, CustomT>>,
  ): Promise<any> {
    ctx.res.status = 404;
    const onerror = (err: Error) => ctx.onerror(err);
    const handleResponse = () => this.respond(ctx);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }

  use(fn: Middleware<StateT, CustomT>): IApplication<StateT, CustomT> {
    this.middleware.push(fn);
    return this;
  }

  createContext(
    req: ServerRequest,
    res: ServerResponse,
  ): ParameterizedContext<StateT, CustomT> {
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};
    return context;
  }

  /**
   * Shorthand for:
   *
   *    serve(addr?: string | HTTPOptions);
   */
  listen(addr?: string | HTTPOptions): Server {
    if (!addr) {
      addr = { port: 0 };
    }
    const server = serve(addr);
    this.handle(server);
    return server;
  }

  inspect(): any {
    return this.toJSON();
  }

  toJSON(): any {
    return {
      "subdomainOffset": this.subdomainOffset,
      "proxy": this.proxy,
      "env": this.env,
    };
  }

  onerror(err: any): void {
    if (!(err instanceof Error)) {
      throw new TypeError(`non-error thrown: ${JSON.stringify(err)}`);
    }

    if (404 === (err as any).status || (err as any).expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error();
    console.error(msg.replace(/^/gm, "  "));
    console.error();
  }

  private async respond(
    ctx: ParameterizedContext<StateT, CustomT>,
  ): Promise<void> {
    // allow bypassing koa
    if (false === ctx.respond) {
      appDebug("respond: ctx.respond === false");
      return;
    }

    if (!ctx.writable) {
      appDebug("respond: ctx.writable === false");
      return;
    }

    let body = ctx.body;
    const code = ctx.status;

    // ignore body
    if (statusEmpty[code]) {
      // strip headers
      ctx.body = null;
      appDebug("respond: empty response");
      return ctx.req.respond(ctx.res);
    }

    if ("HEAD" === ctx.method) {
      if (!ctx.response.has("Content-Length")) {
        const { length } = ctx.response;
        if (length) {
          ctx.length = length;
        }
      }
      appDebug("respond: HEAD response");
      const _res = Object.assign({}, ctx.res);
      _res.body = undefined;
      return ctx.req.respond(_res);
    }

    // status body
    if (null == body) {
      if (ctx.response._explicitNullBody) {
        ctx.response.remove("Content-Type");
        ctx.response.remove("Transfer-Encoding");
        appDebug("respond: explicit null body");
        const _res = Object.assign({}, ctx.res);
        _res.body = undefined;
        return ctx.req.respond(_res);
      }
      if (ctx.req.protoMajor >= 2) {
        body = String(code);
      } else {
        body = ctx.message || String(code);
      }
      ctx.type = "text";
      ctx.length = byteLength(body);
      appDebug(`respond: default null reponse: `, ctx.res);
      return ctx.req.respond(Object.assign({}, ctx.res, { body }));
    }

    // responses
    if (
      "string" === typeof body ||
      body instanceof Uint8Array ||
      isReader(body)
    ) {
      appDebug(`respond: string, Uint8Array or Deno.Reader response`);
      return ctx.req.respond(Object.assign({}, ctx.res, { body }));
    }

    appDebug(`respond: JSON response`);
    // body: json
    body = JSON.stringify(body);
    ctx.length = byteLength(body);
    return ctx.req.respond(Object.assign({}, ctx.res, { body }));
  }
}

export {
  Application,
  ServerRequest,
  Server,
  HTTPOptions,
  ApplicationOptions,
};
