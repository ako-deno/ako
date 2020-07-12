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
  delegates,
  STATUS_TEXT,
  createError,
  debug,
} from "../deps.ts";
import { assert } from "./lib/assert.ts";
import { ProtoContext, ExtendableContext } from "./koa_type.ts";

const contextDebug = debug("ako:context");

export const context: ProtoContext = {
  /**
   * inspect() implementation, which
   * just returns the JSON output.
   *
   * @return {Object}
   * @api public
   */

  inspect() {
    if (this === context) return this;
    return this.toJSON();
  },

  /**
   * Return JSON representation.
   *
   * Here we explicitly invoke .toJSON() on each
   * object, as iteration will otherwise fail due
   * to the getters and cause utilities such as
   * clone() to fail.
   *
   * @return {Object}
   * @api public
   */

  toJSON() {
    const _this = this as ExtendableContext;
    return {
      request: _this.request.toJSON(),
      response: _this.response.toJSON(),
      app: _this.app.toJSON(),
      originalUrl: _this.originalUrl,
      req: "<original Deno req>",
      res: "<original Deno res>",
      socket: "<original Deno Conn>",
    };
  },

  /**
   * Similar to .throw(), adds assertion.
   *
   *    this.assert(this.user, 401, 'Please login!');
   *
   *
   * @param {Mixed} test
   * @param {Number} status
   * @param {String} message
   * @api public
   */

  assert: assert,

  /**
   * Throw an error with `msg` and optional `status`
   * defaulting to 500. Note that these are user-level
   * errors, and the message may be exposed to the client.
   *
   *    this.throw(403)
   *    this.throw(400, 'name required')
   *    this.throw(400, 'name required', {text: "error"})
   *
   * See: https://deno.land/x/http_errors
   */
  throw(status: any, message?: any, props?: any): never {
    throw createError(status, message, props);
  },

  /**
   * Default error handling.
   *
   * @param {Error} err
   * @api private
   */

  onerror(err?: any) {
    contextDebug("onerror:", err);
    // don't do anything if there is no error.
    if (null == err) return;

    if (!(err instanceof Error)) {
      err = new Error(`non-error thrown: ${JSON.stringify(err)}`);
    }

    const _this = this as ExtendableContext;

    let headerSent = false;
    if (_this.headerSent || !_this.writable) {
      headerSent = (err as any).headerSent = true;
    }

    // delegate
    _this.app.emit("error", err, this);

    // nothing we can do here other
    // than delegate to the app-level
    // handler and log.
    if (headerSent) {
      return;
    }

    // first unset all headers
    _this.res.headers = new Headers();

    // then set those specified
    _this.set(err.headers);

    // force text/plain
    _this.type = "text";

    let statusCode = err.status || err.statusCode;

    // ENOENT support
    if ("ENOENT" === err.code) statusCode = 404;

    // default to 500
    if (
      "number" !== typeof statusCode ||
      !STATUS_TEXT.has(statusCode)
    ) {
      statusCode = 500;
    }

    // respond
    const code = STATUS_TEXT.get(statusCode);
    const msg = err.expose ? err.message : code;
    _this.status = err.status = statusCode;
    _this.req.respond(Object.assign({}, _this.res, { body: msg }));
  },
  // get cookies() {
  // },

  // set cookies(_cookies) {
  // }
};

/**
 * Response delegation.
 */

delegates(context, "response")
  .method("attachment")
  .method("redirect")
  .method("remove")
  .method("vary")
  .method("has")
  .method("set")
  .method("append")
  .method("flushHeaders")
  .access("status")
  .access("message")
  .access("body")
  .access("length")
  .access("type")
  .access("lastModified")
  .access("etag")
  .getter("headerSent")
  .getter("writable");

/**
 * Request delegation.
 */

delegates(context, "request")
  .method("acceptsLanguages")
  .method("acceptsEncodings")
  .method("acceptsCharsets")
  .method("accepts")
  .method("get")
  .method("is")
  .access("querystring")
  .access("idempotent")
  .access("socket")
  .access("search")
  .access("method")
  .access("query")
  .access("path")
  .access("url")
  .access("accept")
  .getter("origin")
  .getter("href")
  .getter("subdomains")
  .getter("protocol")
  .getter("host")
  .getter("hostname")
  .getter("URL")
  .getter("header")
  .getter("headers")
  .getter("secure")
  .getter("stale")
  .getter("fresh")
  .getter("ips")
  .getter("ip");
