import {
  serve,
  Server,
  HTTPOptions,
  ServerRequest,
  Response as ServerResponse,
  EventEmitter,
} from "../deps.ts";
import { Context } from "./context.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

type HttpHandler = (context: Context) => Promise<any>;

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
  }

  proxy: boolean = false;
  proxyIpHeader: string = "X-Forwarded-For";
  maxIpsCount: number = 0;
  env: string = "development";
  subdomainOffset: number = 2;

  private async handle(server: Server): Promise<void> {
    for await (const req of server) {
      if (this.handler) {
        const res: ServerResponse = {
          headers: new Headers(),
        };
        const context = this.createContext(req, res);
        await this.handler(context);
      }
    }
  }

  private handler: HttpHandler | undefined;

  use(handler: HttpHandler): Application {
    this.handler = handler;
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

export {
  Application,
  ServerRequest,
  Server,
  HTTPOptions,
  ApplicationOptions,
};
