import { ServerRequest, qsStringify, qsParse, isIP } from "../deps.ts";
import { Application } from "./application.ts";
import { parse as contentTypeParse } from "../deps.ts";

type QueryStringObject = { [key: string]: string[] | string };

class Request {
  constructor(req: ServerRequest, app: Application) {
    this.req = req;
    this.app = app;
    this.originalUrl = req.url;
  }

  req: ServerRequest;
  private app: Application;
  private memoizedURL: URL | Object | undefined;
  private _querycache: Map<string, QueryStringObject> = new Map();
  private _ip: string | undefined;

  /**
   * Get full request URL.
   */
  private get fullHref(): string {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.url)) return this.url;
    return this.origin + this.url;
  }

  originalUrl: string;

  /**
   * Return request header.
   */
  get header(): Headers {
    return this.req.headers;
  }

  /**
   * Set request header.
   */
  set header(val: Headers) {
    this.req.headers = val;
  }

  /**
   * Return request header, alias as request.header
   */
  get headers(): Headers {
    return this.req.headers;
  }

  /**
   * Set request header, alias as request.header
   */
  set headers(val: Headers) {
    this.req.headers = val;
  }

  /**
   * Get request URL.
   */

  get url(): string {
    return this.req.url;
  }

  /**
   * Set request URL.
   */
  set url(val) {
    this.req.url = val;
  }

  /**
   * Get origin of URL.
   */

  get origin(): string {
    return `${this.protocol}://${this.host}`;
  }

  /**
   * Get orignial full request URL.
   */
  get href(): string {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.originalUrl)) return this.originalUrl;
    return this.origin + this.originalUrl;
  }

  /**
   * Get request method.
   */
  get method(): string {
    return this.req.method;
  }

  /**
   * Set request method.
   */
  set method(val) {
    this.req.method = val;
  }

  /**
   * Get request pathname.
   */
  get path(): string {
    const url = new URL(this.fullHref);
    return url.pathname;
  }

  /**
   * Set pathname, retaining the query-string when present.
   */
  set path(path: string) {
    const url = new URL(this.fullHref);
    if (url.pathname === path) {
      return;
    }
    url.pathname = path;
    this.url = `${path}${url.search}`;
  }

  /**
   * Get parsed query-string.
   */
  get query(): QueryStringObject {
    const str = this.querystring;
    const c = this._querycache;
    if (c.has(str)) {
      return c.get(str) || {};
    }
    const queryObj = qsParse(str);
    c.set(str, queryObj);
    return queryObj;
  }

  /**
   * Set query-string as an object.
   */
  set query(obj: QueryStringObject) {
    this.querystring = qsStringify(obj);
  }

  /**
   * Get query string.
   */
  get querystring(): string {
    if (!this.req) return "";
    const url = new URL(this.fullHref);
    if (url.search.length >= 1) {
      return url.search.slice(1);
    } else {
      return "";
    }
  }

  /**
   * Set querystring.
   */
  set querystring(str: string) {
    const url = new URL(this.fullHref);
    if (url.search === `?${str}`) return;
    url.search = `?${str}`;
    this.url = `${url.pathname}?${str}`;
  }

  /**
   * Get the search string. Same as the querystring
   * except it includes the leading ?.
   */
  get search(): string {
    const url = new URL(this.fullHref);
    return url.search;
  }

  /**
   * Set the search string. Same as
   * request.querystring= but included for ubiquity.
   */
  set search(str: string) {
    this.querystring = str;
  }

  /**
   * Parse the "Host" header field host
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   */
  get host(): string {
    const proxy = this.app.proxy;
    let host = proxy && this.get("X-Forwarded-Host");
    if (!host) {
      host = this.get("Host");
    }
    if (!host) return "";
    return host.split(/\s*,\s*/, 1)[0];
  }

  /**
   * Parse the "Host" header field hostname
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   */
  get hostname() {
    const host = this.host;
    if (!host) return "";
    if ("[" == host[0]) return (this.URL as URL).hostname || ""; // IPv6
    return host.split(":", 1)[0];
  }

  /**
   * Get WHATWG parsed original URL.
   * Lazily memoized.
   */
  get URL(): URL | Object {
    if (this.memoizedURL == undefined) {
      try {
        this.memoizedURL = new URL(this.href);
      } catch (err) {
        this.memoizedURL = Object.create(null);
      }
    }
    return this.memoizedURL as URL | Object;
  }

  /**
   * Check if the request is idempotent.
   */
  get idempotent(): boolean {
    const methods = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"];
    return !!~methods.indexOf(this.method);
  }

  /**
   * Return the request conn.
   */
  get socket(): Deno.Conn {
    return this.req.conn;
  }

  /**
   * Get the charset when present or undefined.
   */
  get charset(): string {
    try {
      const { parameters } = contentTypeParse(this.get("Content-Type"));
      return (parameters && parameters.charset) || "";
    } catch (e) {
      return "";
    }
  }

  /**
   * Return parsed Content-Length when present.
   */
  get length(): number | undefined {
    const len = this.get("Content-Length");
    if (len == "") return;
    return ~~len;
  }

  /**
   * Return the protocol string "http" or "https"
   * when requested with TLS. When the proxy setting
   * is enabled the "X-Forwarded-Proto" header
   * field will be trusted. If you're running behind
   * a reverse proxy that supplies https for you this
   * may be enabled.
   */
  get protocol(): string {
    if (!this.app.proxy) return "http";
    const proto = this.get("X-Forwarded-Proto");
    return proto ? proto.split(/\s*,\s*/, 1)[0] : "http";
  }

  /**
   * Short-hand for:
   *
   *    this.protocol == 'https'
   */
  get secure(): boolean {
    return "https" == this.protocol;
  }

  /**
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list.
   *
   * For example if the value were "client, proxy1, proxy2"
   * you would receive the array `["client", "proxy1", "proxy2"]`
   * where "proxy2" is the furthest down-stream.
   */
  get ips(): string[] {
    const proxy = this.app.proxy;
    const val = this.get(this.app.proxyIpHeader);
    let ips = proxy && val ? val.split(/\s*,\s*/) : [];
    if (this.app.maxIpsCount > 0) {
      ips = ips.slice(-this.app.maxIpsCount);
    }
    return ips;
  }

  /**
   * Return request's remote address
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list and return the first one
   */
  get ip(): string {
    if (!this._ip) {
      this._ip = this.ips[0] ||
        (this.socket.remoteAddr as Deno.NetAddr).hostname || "";
    }
    return this._ip;
  }

  set ip(_ip: string) {
    this._ip = _ip;
  }

  /**
   * Return subdomains as an array.
   *
   * Subdomains are the dot-separated parts of the host before the main domain
   * of the app. By default, the domain of the app is assumed to be the last two
   * parts of the host. This can be changed by setting `app.subdomainOffset`.
   *
   * For example, if the domain is "tobi.ferrets.example.com":
   * If `app.subdomainOffset` is not set, this.subdomains is
   * `["ferrets", "tobi"]`.
   * If `app.subdomainOffset` is 3, this.subdomains is `["tobi"]`.
   */
  get subdomains(): string[] {
    const offset = this.app.subdomainOffset;
    const hostname = this.hostname;
    if (isIP(hostname)) return [];
    return hostname
      .split(".")
      .reverse()
      .slice(offset);
  }

  /**
   * Return request header.
   *
   * The `Referrer` header field is special-cased,
   * both `Referrer` and `Referer` are interchangeable.
   *
   * Examples:
   *
   *     this.get('Content-Type');
   *     // => "text/plain"
   *
   *     this.get('content-type');
   *     // => "text/plain"
   *
   *     this.get('Something');
   *     // => ''
   */
  get(field: string): string {
    const req = this.req;
    switch (field = field.toLowerCase()) {
      case "referer":
      case "referrer":
        return req.headers.get("referrer") || req.headers.get("referer") || "";
      default:
        return req.headers.get("field") || "";
    }
  }
}

export { Request, QueryStringObject };
