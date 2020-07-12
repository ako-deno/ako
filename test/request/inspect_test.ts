import { describe, it, assert, assertEquals } from "../deps.ts";
import { request } from "../helpers/context.ts";

describe("req.inspect()", () => {
  describe("with no request.req present", () => {
    it("should return null", () => {
      const req = request();
      req.method = "GET";
      delete req.req;
      assert("undefined" === req.inspect());
      assert("undefined" === Deno.inspect(req));
    });
  });

  it("should return a json representation", () => {
    const req = request();
    req.method = "GET";
    req.url = "example.com";
    req.header.set("host", "example.com");

    const expected = {
      method: "GET",
      url: "example.com",
      header: {
        host: "example.com",
      },
    };

    assertEquals(req.inspect(), Deno.inspect(expected));
    assertEquals(Deno.inspect(req), Deno.inspect(expected));
  });
});
