import {
  serve,
  Server,
  HTTPOptions,
  ServerRequest,
  Response as ServerResponse,
  EventEmitter,
} from "../deps.ts";
import { compose, Middleware, Next } from "./compose.ts";
import { Context } from "./context.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

type HttpHandler = (req: ServerRequest, res: ServerResponse) => Promise<any>;

interface ApplicationOptions {
  proxy?: boolean;
  proxyIpHeader?: string;
  maxIpsCount?: number;
  env?: string;
  subdomainOffset?: number;
}

class Application extends EventEmitter {
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
  }

  middleware: Middleware[];
  proxy: boolean = false;
  proxyIpHeader: string = "X-Forwarded-For";
  maxIpsCount: number = 0;
  env: string = "development";
  subdomainOffset: number = 2;

  private async handle(server: Server): Promise<void> {
    const httpHandler = this.callback();
    for await (const req of server) {
      const res: ServerResponse = {
        headers: new Headers(),
      };
      await httpHandler(req, res);
    }
  }

  /**
   * Return a request handler callback
   * for Deno's std http server.
   *
   * @return {HttpHandler}
   * @api public
   */

  callback(): HttpHandler {
    const fn = compose(this.middleware);

    const handleRequest: HttpHandler = (req, res) => {
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

  private handleRequest(ctx: Context, fnMiddleware: Middleware): Promise<any> {
    ctx.res.status = 404;
    const onerror = (err: Error) => ctx.onerror(err);
    const handleResponse = () => respond(ctx);
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }

  use(fn: Middleware): Application {
    this.middleware.push(fn);
    return this;
  }

  createContext(req: ServerRequest, res: ServerResponse): Context {
    const request = new Request(req, this);
    const response = new Response(res, this);
    return new Context(request, response);
  }

  /**
   * Shorthand for:
   *
   *    serve(addr: string | HTTPOptions);
   */
  listen(addr: string | HTTPOptions): Server {
    const server = serve(addr);
    this.handle(server);
    return server;
  }
}

function respond(ctx: Context): void {
  if (ctx.body) {
    ctx.res.body = ctx.body;
    ctx.res.status = 200;
  }
  ctx.req.respond(ctx.res);
}

export {
  Application,
  ServerRequest,
  Server,
  HTTPOptions,
  ApplicationOptions,
};
