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
  assert,
  STATUS_TEXT,
  vary,
  encodeUrl,
  contentType,
  is,
} from "../deps.ts";
import {
  byteLength,
  statusEmpty,
  statusRedirect,
  isReader,
} from "./utill.ts";

const _explicitStatus = Symbol("_explicitStatus");

const Response = {
  /**
   * Return the request socket.
   *
   * @return {Connection}
   * @api public
   */

  get socket(): Deno.Conn {
    return (this as any).res.socket;
  },

  /**
   * Return response header.
   *
   * @return {Headers}
   * @api public
   */

  get header(): Headers {
    const { res } = this as any;
    return res.headers ?? new Headers(); // Node < 7.7
  },

  /**
   * Return response header, alias as response.header
   *
   * @return {Headers}
   * @api public
   */

  get headers(): Headers {
    return this.header;
  },

  /**
   * Get response status code.
   *
   * @return {Number}
   * @api public
   */

  get status(): number {
    return (this as any).res.status;
  },

  /**
   * Set response status code.
   *
   * @param {Number} code
   * @api public
   */

  set status(code: number) {
    if (this.headerSent) return;
    assert(Number.isInteger(code), "status code must be a number");
    assert(code >= 100 && code <= 999, `invalid status code: ${code}`);
    (this as any)[_explicitStatus] = true;
    (this as any).res.status = code;
    if (this.body && statusEmpty[code]) this.body = null;
  },

  /**
   * Get response status message
   *
   * @return {String}
   * @api public
   */

  get message() {
    return STATUS_TEXT.get(this.status);
  },

  /**
   * Set response status message
   *
   * @param {String} msg
   * @api public
   */

  set message(msg) {
    // Deno doesn't not support this feature yet.
  },

  /**
   * Get response body.
   *
   * @return {Mixed}
   * @api public
   */

  get body(): any {
    const _body = (this as any).res.body;
    return _body ? _body : null;
  },

  /**
   * Set response body.
   *
   * @param {String|Buffer|Object|Stream} val
   * @api public
   */

  set body(val: any) {
    const original = (this as any).res.body;
    (this as any).res.body = val;

    // no content
    if (null == val) {
      if (!statusEmpty[this.status]) this.status = 204;
      if (val === null) this._explicitNullBody = true;
      this.remove("Content-Type");
      this.remove("Content-Length");
      this.remove("Transfer-Encoding");
      return;
    }

    // set the status
    if (!(this as any)[_explicitStatus]) this.status = 200;

    // set the content-type only if not yet set
    const setType = !this.has("Content-Type");

    // string
    if ("string" === typeof val) {
      if (setType) this.type = /^\s*</.test(val) ? "html" : "text";
      this.length = byteLength(val);
      return;
    }

    // buffer
    if (val instanceof Uint8Array) {
      if (setType) this.type = "bin";
      this.length = val.byteLength;
      return;
    }

    // Reader
    if (isReader(val)) {
      if (original != val) {
        // overwriting
        if (null != original) this.remove("Content-Length");
      }
      if (setType) this.type = "bin";
      return;
    }

    // json
    this.remove("Content-Length");
    this.type = "json";
  },

  /**
   * Set Content-Length field to `n`.
   *
   * @param {Number} n
   * @api public
   */

  set length(n) {
    this.set("Content-Length", n);
  },

  /**
   * Return parsed response Content-Length when present.
   *
   * @return {Number}
   * @api public
   */

  get length() {
    if (this.has("Content-Length")) {
      return parseInt(this.get("Content-Length"), 10) || 0;
    }

    const { body } = this;
    if (!body || isReader(body)) return undefined;
    if ("string" === typeof body) return byteLength(body);
    if (body instanceof Uint8Array) return body.byteLength;
    return byteLength(JSON.stringify(body));
  },

  /**
   * Check if a header has been written to the socket.
   *
   * @return {Boolean}
   * @api public
   */

  get headerSent(): boolean {
    // return this.res.headersSent;
    return false;
  },

  /**
   * Vary on `field`.
   *
   * @param {String|Array} field
   * @api public
   */

  vary(field: string | string[]): void {
    if (this.headerSent) return;

    vary((this as any).res.headers, field);
  },

  /**
   * Perform a 302 redirect to `url`.
   *
   * The string "back" is special-cased
   * to provide Referrer support, when Referrer
   * is not present `alt` or "/" is used.
   *
   * Examples:
   *
   *    this.redirect('back');
   *    this.redirect('back', '/index.html');
   *    this.redirect('/login');
   *    this.redirect('http://google.com');
   *
   * @param {String} url
   * @param {String} [alt]
   * @api public
   */

  redirect(url: string, alt?: string) {
    // location
    if ("back" === url) url = (this as any).ctx.get("Referrer") || alt || "/";
    this.set("Location", encodeUrl(url));

    // status
    if (!statusRedirect[this.status]) this.status = 302;

    // html
    if ((this as any).ctx.accepts(["html"])) {
      url = escape(url);
      this.type = "text/html; charset=utf-8";
      this.body = `Redirecting to <a href="${url}">${url}</a>.`;
      return;
    }

    // text
    this.type = "text/plain; charset=utf-8";
    this.body = `Redirecting to ${url}.`;
  },

  /**
   * Set Content-Disposition header to "attachment" with optional `filename`.
   *
   * @param {String} filename
   * @api public
   */

  attachment(filename: string, options: any) {
    // if (filename) this.type = extname(filename);
    // this.set('Content-Disposition', contentDisposition(filename, options));
  },

  /**
   * Set Content-Type response header with `type` through `mime.lookup()`
   * when it does not contain a charset.
   *
   * Examples:
   *
   *     this.type = '.html';
   *     this.type = 'html';
   *     this.type = 'json';
   *     this.type = 'application/json';
   *     this.type = 'png';
   *
   * @param {String} type
   * @api public
   */

  set type(type: string) {
    if (type) {
      const _type = contentType(type);
      if (_type) {
        this.set("Content-Type", _type);
      } else {
        this.remove("Content-Type");
      }
    } else {
      this.remove("Content-Type");
    }
  },

  /**
   * Set the Last-Modified date using a string or a Date.
   *
   *     this.response.lastModified = new Date();
   *     this.response.lastModified = '2013-09-13';
   *
   * @param {String|Date} type
   * @api public
   */

  set lastModified(val: string | Date | undefined) {
    if (val) {
      if ("string" === typeof val) val = new Date(val);
      this.set("Last-Modified", val.toUTCString());
    }
  },

  /**
   * Get the Last-Modified date in Date form, if it exists.
   *
   * @return {Date|undefined}
   * @api public
   */

  get lastModified(): Date | undefined | string {
    const date = this.get("last-modified");
    if (date) return new Date(date);
  },

  /**
   * Set the ETag of a response.
   * This will normalize the quotes if necessary.
   *
   *     this.response.etag = 'md5hashsum';
   *     this.response.etag = '"md5hashsum"';
   *     this.response.etag = 'W/"123456789"';
   *
   * @param {String} etag
   * @api public
   */

  set etag(val) {
    if (!/^(W\/)?"/.test(val)) val = `"${val}"`;
    this.set("ETag", val);
  },

  /**
   * Get the ETag of a response.
   *
   * @return {String}
   * @api public
   */

  get etag() {
    return this.get("ETag");
  },

  /**
   * Return the response mime type void of
   * parameters such as "charset".
   *
   * @return {String}
   * @api public
   */

  get type(): string {
    const type = this.get("Content-Type");
    if (!type) return "";
    return type.split(";", 1)[0];
  },

  /**
   * Check whether the response is one of the listed types.
   * Pretty much the same as `this.request.is()`.
   *
   * @param {String|String[]} [type]
   * @param {String[]} [types]
   * @return {String|false}
   * @api public
   */

  is(types: string[]) {
    return is(this.type, types);
  },

  /**
   * Return response header.
   *
   * Examples:
   *
   *     this.get('Content-Type');
   *     // => "text/plain"
   *
   *     this.get('content-type');
   *     // => "text/plain"
   *
   * @param {String} field
   * @return {String}
   * @api public
   */

  get(field: string): string {
    return this.header.get(field.toLowerCase()) || "";
  },

  /**
   * Returns true if the header identified by name is currently set in the outgoing headers.
   * The header name matching is case-insensitive.
   *
   * Examples:
   *
   *     this.has('Content-Type');
   *     // => true
   *
   *     this.get('content-type');
   *     // => true
   *
   * @param {String} field
   * @return {boolean}
   * @api public
   */
  has(field: string): boolean {
    return this.header.has(field);
  },

  /**
   * Set header `field` to `val`, or pass
   * an object of header fields.
   *
   * Examples:
   *
   *    this.set('Foo', ['bar', 'baz']);
   *    this.set('Accept', 'application/json');
   *    this.set({ Accept: 'text/plain', 'X-API-Key': 'tobi' });
   *
   * @param {String|Object} field
   * @param {String|Array} val
   * @api public
   */

  set(field: any, val: any | any[]) {
    if (this.headerSent) return;

    if (2 === arguments.length) {
      if (Array.isArray(val)) {
        val = val.map((v) => typeof v === "string" ? v : String(v));
      } else if (typeof val !== "string") {
        val = String(val);
      }
      (this as any).res.headers.set(field, val);
    } else {
      for (const key in field) {
        this.set(key, field[key]);
      }
    }
  },

  /**
   * Append additional header `field` with value `val`.
   *
   * Examples:
   *
   * ```
   * this.append('Link', ['<http://localhost/>', '<http://localhost:3000/>']);
   * this.append('Set-Cookie', 'foo=bar; Path=/; HttpOnly');
   * this.append('Warning', '199 Miscellaneous warning');
   * ```
   *
   * @param {String} field
   * @param {String|Array} val
   * @api public
   */

  append(field: string, val: string | string[]) {
    const prev = this.get(field);

    if (prev) {
      val = Array.isArray(prev) ? prev.concat(val) : [prev].concat(val);
    }

    return this.set(field, val);
  },

  /**
   * Remove header `field`.
   *
   * @param {String} name
   * @api public
   */

  remove(field: string) {
    if (this.headerSent) return;

    (this as any).res.remove(field);
  },

  /**
   * Checks if the request is writable.
   * Tests for the existence of the socket
   * as node sometimes does not set it.
   *
   * @return {Boolean}
   * @api private
   */

  get writable() {
    return true;
  },

  /**
   * Inspect implementation.
   *
   * @return {Object}
   * @api public
   */

  inspect() {
    if (!(this as any).res) return;
    const o = this.toJSON();
    o.body = this.body;
    return o;
  },

  /**
   * Return JSON representation.
   *
   * @return {Object}
   * @api public
   */

  toJSON(): any {
    const header: any = {};
    this.header.forEach((v, k) => {
      header[k] = v;
    });
    return {
      status: this.status,
      message: this.message,
      header,
    };
  },

  /**
   * Flush any set headers, and begin the body
   */
  flushHeaders(): void {
  },

  _explicitNullBody: false,
};

export { Response };
