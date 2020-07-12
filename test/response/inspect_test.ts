import { describe, it, assert, assertEquals } from "../deps.ts";
import { response } from "../helpers/context.ts";

describe("res.inspect()", () => {
  describe("with no response.res present", () => {
    it("should return null", () => {
      const res = response();
      res.body = "hello";
      delete res.res;
      assertEquals(res.inspect(), "undefined");
      assertEquals(Deno.inspect(res), "undefined");
    });
  });

  it("should return a json representation", () => {
    const res = response();
    res.body = "hello";

    const expected = {
      status: 200,
      message: "OK",
      header: {
        "content-type": "text/plain; charset=utf-8",
        "content-length": "5",
      },
      body: "hello",
    };

    assertEquals(res.inspect(), Deno.inspect(expected));
    assertEquals(Deno.inspect(res), Deno.inspect(expected));
  });
});
