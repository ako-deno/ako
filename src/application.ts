import { serve, Server, HTTPOptions, ServerRequest } from "../deps.ts";
import { EventEmitter } from "../deps.ts";

type HttpHandler = (req: ServerRequest) => Promise<any>;

class Application extends EventEmitter {
  constructor(handler: HttpHandler) {
    super();
    this.handler = handler;
  }

  private handler: HttpHandler;

  private async handle(server: Server): Promise<void> {
    for await (const req of server) {
      await this.handler(req);
    }
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
};
